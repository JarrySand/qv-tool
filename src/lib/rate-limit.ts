/**
 * レート制限ユーティリティ
 *
 * インメモリのスライディングウィンドウ実装。Vercel の Lambda は
 * インスタンスごとに別プロセスのため、レート制限は同一インスタンスに
 * フォールドされたリクエスト間でのみ機能する。クローズドな PoC では
 * これで十分。パブリック公開する際は分散ストア(Upstash/Redis 等)に
 * 差し替えること。
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
 * インメモリのスライディングウィンドウレート制限。
 */
class InMemoryRateLimiter {
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

// レート制限インスタンス（遅延初期化）
let voteRateLimiter: InMemoryRateLimiter | null = null;
let eventCreateRateLimiter: InMemoryRateLimiter | null = null;
let surveyRateLimiter: InMemoryRateLimiter | null = null;

/**
 * 投票送信用レート制限をチェック
 *
 * 1分間に5回まで投票可能です。
 */
export async function checkVoteRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!voteRateLimiter) {
    voteRateLimiter = new InMemoryRateLimiter(
      RATE_LIMITS.VOTE_MAX_REQUESTS,
      RATE_LIMITS.VOTE_WINDOW_MS
    );
  }
  return voteRateLimiter.limit(identifier);
}

/**
 * イベント作成用レート制限をチェック
 *
 * 1時間に10回までイベントを作成可能です。
 */
export async function checkEventCreateRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!eventCreateRateLimiter) {
    eventCreateRateLimiter = new InMemoryRateLimiter(
      RATE_LIMITS.EVENT_CREATE_MAX_REQUESTS,
      RATE_LIMITS.EVENT_CREATE_WINDOW_MS
    );
  }
  return eventCreateRateLimiter.limit(identifier);
}

/**
 * アンケート送信用レート制限をチェック
 *
 * 投票送信とは独立したバケット。投票完了直後にアンケート送信する
 * 通常の動線で、投票のバケットを消費してしまわないように分離する。
 */
export async function checkSurveyRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!surveyRateLimiter) {
    surveyRateLimiter = new InMemoryRateLimiter(
      RATE_LIMITS.SURVEY_MAX_REQUESTS,
      RATE_LIMITS.SURVEY_WINDOW_MS
    );
  }
  return surveyRateLimiter.limit(identifier);
}

/**
 * クライアントIPアドレスを取得するヘルパー関数
 *
 * Vercel、Cloudflare などのプロキシ環境に対応しています。
 */
export function getClientIp(headersList: Headers): string {
  // Vercel 固有のヘッダーを最優先（信頼できる)
  const vercelIp = headersList.get("x-vercel-forwarded-for");
  if (vercelIp) {
    return vercelIp.split(",")[0].trim();
  }

  // Cloudflare 固有のヘッダー
  const cfIp = headersList.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  // 汎用 X-Forwarded-For (クライアント側で偽装可能なので最後)
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // その他のプロキシ
  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // フォールバック
  return "anonymous";
}
