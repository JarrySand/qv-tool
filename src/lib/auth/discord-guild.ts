/**
 * Discord ギルド（サーバー）関連のユーティリティ
 * ユーザーの所属サーバー確認や、ゲート機能のためのAPI連携を行う
 */

const DISCORD_API_BASE = "https://discord.com/api/v10";

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
 * ユーザーが所属しているDiscordサーバー一覧を取得
 * @param accessToken Discord OAuth アクセストークン
 * @returns 所属サーバー一覧
 */
export async function getUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to fetch user guilds:", error);
    throw new Error(`Failed to fetch user guilds: ${response.status}`);
  }

  return response.json();
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

