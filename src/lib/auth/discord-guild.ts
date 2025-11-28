/**
 * Discord ギルド（サーバー）関連のユーティリティ
 * ユーザーの所属サーバー確認や、ゲート機能のためのAPI連携を行う
 */

const DISCORD_API_BASE = "https://discord.com/api/v10";

// キャッシュの有効期限（5分）
const CACHE_TTL_MS = 5 * 60 * 1000;

// レート制限時のデフォルト待機時間（秒）
const DEFAULT_RETRY_AFTER = 1;

// 最大リトライ回数
const MAX_RETRIES = 3;

/**
 * シンプルなインメモリキャッシュ
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const guildCache = new Map<string, CacheEntry<DiscordGuild[]>>();
const memberCache = new Map<string, CacheEntry<DiscordGuildMember | null>>();

/**
 * キャッシュキーを生成
 */
function getCacheKey(accessToken: string, ...parts: string[]): string {
  // トークンの最後の8文字をキーの一部として使用（セキュリティのため全体は使わない）
  const tokenSuffix = accessToken.slice(-8);
  return `${tokenSuffix}:${parts.join(":")}`;
}

/**
 * キャッシュからデータを取得
 */
function getFromCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string
): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * キャッシュにデータを保存
 */
function setToCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  data: T
): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Discordギルド（サーバー）の型定義
 */
export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

/**
 * Discordギルドメンバーの型定義
 * /users/@me/guilds/{guild.id}/member エンドポイントのレスポンス
 */
export interface DiscordGuildMember {
  user?: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  nick?: string | null;
  roles: string[];
  joined_at: string;
  deaf: boolean;
  mute: boolean;
}

/**
 * レート制限を考慮したfetch
 * @param url リクエストURL
 * @param options fetchオプション
 * @param retries 残りリトライ回数
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  const response = await fetch(url, options);

  // レート制限の場合
  if (response.status === 429 && retries > 0) {
    const retryData = await response.json().catch(() => ({}));
    const retryAfter = (retryData.retry_after || DEFAULT_RETRY_AFTER) * 1000;

    console.warn(`Discord API rate limited. Retrying after ${retryAfter}ms...`);

    // 待機してからリトライ
    await new Promise((resolve) => setTimeout(resolve, retryAfter));
    return fetchWithRetry(url, options, retries - 1);
  }

  return response;
}

/**
 * ユーザーが所属しているDiscordサーバー一覧を取得
 * @param accessToken Discord OAuth アクセストークン
 * @returns 所属サーバー一覧
 */
export async function getUserGuilds(
  accessToken: string
): Promise<DiscordGuild[]> {
  // キャッシュをチェック
  const cacheKey = getCacheKey(accessToken, "guilds");
  const cached = getFromCache(guildCache, cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetchWithRetry(
    `${DISCORD_API_BASE}/users/@me/guilds`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to fetch user guilds:", error);
    throw new Error(`Failed to fetch user guilds: ${response.status}`);
  }

  const guilds = await response.json();

  // キャッシュに保存
  setToCache(guildCache, cacheKey, guilds);

  return guilds;
}

/**
 * ユーザーが特定のDiscordサーバーのメンバーかどうかを確認
 * @param accessToken Discord OAuth アクセストークン
 * @param guildId 確認するサーバーのID
 * @returns メンバーであればtrue、そうでなければfalse
 */
export async function isGuildMember(
  accessToken: string,
  guildId: string
): Promise<boolean> {
  try {
    const guilds = await getUserGuilds(accessToken);
    return guilds.some((guild) => guild.id === guildId);
  } catch (error) {
    console.error("Error checking guild membership:", error);
    return false;
  }
}

/**
 * ギルドIDのフォーマットを検証
 * Discord のギルドIDは17-19桁の数値文字列
 * @param guildId 検証するギルドID
 * @returns 有効なフォーマットであればtrue
 */
export function isValidGuildId(guildId: string): boolean {
  // Discordのスノーフレーク形式: 17-19桁の数値
  return /^\d{17,19}$/.test(guildId);
}

/**
 * ギルド情報を取得（名前など）
 * 注意: この関数はBotトークンが必要な場合があります
 * ユーザートークンでは自分が所属しているサーバーの情報のみ取得可能
 * @param accessToken Discord OAuth アクセストークン
 * @param guildId 取得するサーバーのID
 * @returns ギルド情報、見つからない場合はnull
 */
export async function getGuildInfo(
  accessToken: string,
  guildId: string
): Promise<DiscordGuild | null> {
  try {
    const guilds = await getUserGuilds(accessToken);
    return guilds.find((guild) => guild.id === guildId) || null;
  } catch (error) {
    console.error("Error fetching guild info:", error);
    return null;
  }
}

/**
 * 特定のギルドでのユーザーのメンバー情報を取得
 * guilds.members.read スコープが必要
 * @param accessToken Discord OAuth アクセストークン
 * @param guildId 確認するサーバーのID
 * @returns メンバー情報、取得できない場合はnull
 */
export async function getGuildMemberInfo(
  accessToken: string,
  guildId: string
): Promise<DiscordGuildMember | null> {
  // キャッシュをチェック
  const cacheKey = getCacheKey(accessToken, "member", guildId);
  const cached = getFromCache(memberCache, cacheKey);
  if (cached !== null) {
    return cached;
  }

  try {
    const response = await fetchWithRetry(
      `${DISCORD_API_BASE}/users/@me/guilds/${guildId}/member`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      // 404はメンバーでない場合なのでエラーログは出さない
      if (response.status !== 404) {
        const error = await response.text();
        console.error("Failed to fetch guild member info:", error);
      }
      // キャッシュにnullを保存（存在しないことをキャッシュ）
      setToCache(memberCache, cacheKey, null);
      return null;
    }

    const member = await response.json();

    // キャッシュに保存
    setToCache(memberCache, cacheKey, member);

    return member;
  } catch (error) {
    console.error("Error fetching guild member info:", error);
    return null;
  }
}

/**
 * ユーザーが特定のDiscordサーバーで指定されたロールを持っているかを確認
 * @param accessToken Discord OAuth アクセストークン
 * @param guildId 確認するサーバーのID
 * @param roleId 確認するロールのID
 * @returns ロールを持っていればtrue、そうでなければfalse
 */
export async function hasGuildRole(
  accessToken: string,
  guildId: string,
  roleId: string
): Promise<boolean> {
  try {
    const member = await getGuildMemberInfo(accessToken, guildId);
    if (!member) {
      return false;
    }
    return member.roles.includes(roleId);
  } catch (error) {
    console.error("Error checking guild role:", error);
    return false;
  }
}

/**
 * ロールIDのフォーマットを検証
 * Discord のロールIDは17-19桁の数値文字列（スノーフレーク形式）
 * @param roleId 検証するロールID
 * @returns 有効なフォーマットであればtrue
 */
export function isValidRoleId(roleId: string): boolean {
  // Discordのスノーフレーク形式: 17-19桁の数値
  return /^\d{17,19}$/.test(roleId);
}
