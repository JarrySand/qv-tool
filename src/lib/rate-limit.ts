/**
 * レート制限ユーティリティ
 *
 * Upstash Redis を使用したレート制限を実装します。
 * 環境変数が設定されていない場合はインメモリフォールバックを使用します。
 *
 * ## 環境変数
 * - `UPSTASH_REDIS_REST_URL`: Upstash Redis の REST URL
 * - `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis の REST トークン
 *
 * ## セットアップ手順
 * 1. https://upstash.com/ でアカウントを作成
 * 2. Redis データベースを作成
 * 3. 環境変数を設定
 *
 * @module lib/rate-limit
 */

import { RATE_LIMITS } from "@/constants";

/**
 * レート制限の結果型
 */
interface RateLimitResult {
  /** 制限内かどうか */
  success: boolean;
  /** 最大リクエスト数 */
  limit: number;
  /** 残りリクエスト数 */
  remaining: number;
  /** リセット時刻（Unix timestamp） */
  reset: number;
}

/**
 * レート制限のインターフェース
 */
type RateLimiter = {
  limit: (identifier: string) => Promise<RateLimitResult>;
};

/**
 * シンプルなインメモリレート制限（開発用フォールバック）
 *
 * サーバーレス環境では正しく動作しないため、
 * 本番環境では Upstash Redis を使用することを強く推奨します。
 */
class InMemoryRateLimiter implements RateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // ウィンドウが期限切れの場合はリセット
    if (!entry || now >= entry.resetAt) {
      const resetAt = now + this.windowMs;
      this.requests.set(identifier, { count: 1, resetAt });
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: resetAt,
      };
    }

    // リクエスト数をインクリメント
    entry.count++;
    this.requests.set(identifier, entry);

    const remaining = Math.max(0, this.maxRequests - entry.count);
    const success = entry.count <= this.maxRequests;

    return {
      success,
      limit: this.maxRequests,
      remaining,
      reset: entry.resetAt,
    };
  }
}

/**
 * Upstash Redis を使用したレート制限
 */
class UpstashRateLimiter implements RateLimiter {
  private ratelimit: import("@upstash/ratelimit").Ratelimit;

  constructor(ratelimit: import("@upstash/ratelimit").Ratelimit) {
    this.ratelimit = ratelimit;
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const result = await this.ratelimit.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }
}

/**
 * レート制限インスタンスを作成
 *
 * Upstash の環境変数が設定されている場合は Upstash を使用し、
 * そうでない場合はインメモリフォールバックを使用します。
 *
 * @param maxRequests - ウィンドウ内の最大リクエスト数
 * @param windowMs - ウィンドウサイズ（ミリ秒）
 * @param prefix - キーのプレフィックス
 * @returns レート制限インスタンス
 */
async function createRateLimiter(
  maxRequests: number,
  windowMs: number,
  prefix: string
): Promise<RateLimiter> {
  // テスト環境ではインメモリレート制限を使用
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return new InMemoryRateLimiter(maxRequests, windowMs);
  }

  // Upstash の環境変数がある場合は Upstash を使用
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      const { Redis } = await import("@upstash/redis");
      const { Ratelimit } = await import("@upstash/ratelimit");

      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      // スライディングウィンドウアルゴリズムを使用
      const windowSeconds = Math.ceil(windowMs / 1000);
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
        prefix: `ratelimit:${prefix}`,
        analytics: true,
      });

      console.info(`✓ Upstash rate limiting enabled for ${prefix}`);
      return new UpstashRateLimiter(ratelimit);
    } catch (error) {
      console.warn(
        `⚠ Failed to initialize Upstash rate limiting for ${prefix}, falling back to in-memory:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  // フォールバック: インメモリレート制限
  if (process.env.NODE_ENV === "production") {
    console.warn(
      `⚠ Using in-memory rate limiting for ${prefix} in production. ` +
        `Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for distributed rate limiting.`
    );
  } else {
    console.info(`Using in-memory rate limiting for ${prefix}`);
  }
  return new InMemoryRateLimiter(maxRequests, windowMs);
}

// レート制限インスタンス（遅延初期化）
let voteRateLimiter: RateLimiter | null = null;
let eventCreateRateLimiter: RateLimiter | null = null;

/**
 * 投票送信用レート制限をチェック
 *
 * 1分間に5回まで投票可能です。
 * 悪意あるユーザーによる連続投票を防止します。
 *
 * @param identifier - 識別子（通常はIPアドレス）
 * @returns レート制限の結果
 *
 * @example
 * ```ts
 * const result = await checkVoteRateLimit(clientIp);
 * if (!result.success) {
 *   return { error: `Too many requests. Try again in ${result.reset - Date.now()}ms` };
 * }
 * ```
 */
export async function checkVoteRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!voteRateLimiter) {
    voteRateLimiter = await createRateLimiter(
      RATE_LIMITS.VOTE_MAX_REQUESTS,
      RATE_LIMITS.VOTE_WINDOW_MS,
      "vote"
    );
  }
  return voteRateLimiter.limit(identifier);
}

/**
 * イベント作成用レート制限をチェック
 *
 * 1時間に10回までイベントを作成可能です。
 * スパムイベントの作成を防止します。
 *
 * @param identifier - 識別子（通常はIPアドレス）
 * @returns レート制限の結果
 *
 * @example
 * ```ts
 * const result = await checkEventCreateRateLimit(clientIp);
 * if (!result.success) {
 *   const secondsUntilReset = Math.ceil((result.reset - Date.now()) / 1000);
 *   return { error: `Rate limit exceeded. Try again in ${secondsUntilReset} seconds.` };
 * }
 * ```
 */
export async function checkEventCreateRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!eventCreateRateLimiter) {
    eventCreateRateLimiter = await createRateLimiter(
      RATE_LIMITS.EVENT_CREATE_MAX_REQUESTS,
      RATE_LIMITS.EVENT_CREATE_WINDOW_MS,
      "event"
    );
  }
  return eventCreateRateLimiter.limit(identifier);
}

/**
 * クライアントIPアドレスを取得するヘルパー関数
 *
 * Vercel、Cloudflare などのプロキシ環境に対応しています。
 *
 * @param headersList - リクエストヘッダー
 * @returns IPアドレス（取得できない場合は "anonymous"）
 *
 * @example
 * ```ts
 * const headersList = await headers();
 * const clientIp = getClientIp(headersList);
 * ```
 */
export function getClientIp(headersList: Headers): string {
  // Vercel / Cloudflare の場合
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // Vercel 固有のヘッダー
  const vercelIp = headersList.get("x-vercel-forwarded-for");
  if (vercelIp) {
    return vercelIp.split(",")[0].trim();
  }

  // Cloudflare 固有のヘッダー
  const cfIp = headersList.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  // その他のプロキシ
  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // フォールバック
  return "anonymous";
}
