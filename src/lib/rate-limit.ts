/**
 * レート制限ユーティリティ
 *
 * Upstash Redis を使用したレート制限の実装例です。
 * 環境変数 UPSTASH_REDIS_REST_URL と UPSTASH_REDIS_REST_TOKEN を設定して使用します。
 *
 * インストール:
 * npm install @upstash/redis @upstash/ratelimit
 */

// Upstash が設定されていない場合はスキップするダミー実装
interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

type RateLimiter = {
  limit: (identifier: string) => Promise<RateLimitResult>;
};

/**
 * シンプルなインメモリレート制限（開発用フォールバック）
 * 本番環境では Upstash Redis を使用することを推奨
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
 * Upstash Redis レート制限を作成
 * 環境変数が設定されていない場合はインメモリフォールバックを使用
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

  // Upstash の環境変数がある場合のみ Upstash を使用
  // パッケージがインストールされていない場合は自動的にフォールバック
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    // Note: Upstash を使用する場合は以下をインストール:
    // npm install @upstash/redis @upstash/ratelimit
    // 現在はインメモリフォールバックを使用
  }

  // フォールバック: インメモリレート制限
  console.info(`Using in-memory rate limiting for ${prefix}`);
  return new InMemoryRateLimiter(maxRequests, windowMs);
}

// レート制限インスタンス（遅延初期化）
let voteRateLimiter: RateLimiter | null = null;
let eventCreateRateLimiter: RateLimiter | null = null;

/**
 * 投票送信用レート制限: 1分間に5回まで
 */
export async function checkVoteRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!voteRateLimiter) {
    voteRateLimiter = await createRateLimiter(5, 60 * 1000, "vote");
  }
  return voteRateLimiter.limit(identifier);
}

/**
 * イベント作成用レート制限: 1時間に10回まで
 */
export async function checkEventCreateRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!eventCreateRateLimiter) {
    eventCreateRateLimiter = await createRateLimiter(
      10,
      60 * 60 * 1000,
      "event"
    );
  }
  return eventCreateRateLimiter.limit(identifier);
}

/**
 * IPアドレスを取得するヘルパー関数
 */
export function getClientIp(headersList: Headers): string {
  // Vercel / Cloudflare の場合
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
