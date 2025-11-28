/**
 * セキュアトークン生成ユーティリティ
 *
 * 暗号学的に安全なランダムトークンを生成します。
 * 256ビット以上のエントロピーを保証します。
 */

import { randomBytes } from "crypto";

/**
 * セキュアな管理用トークンを生成
 * 256ビット（32バイト）のエントロピーを持つBase64 URL-safeトークン
 *
 * @returns 43文字のBase64 URL-safeトークン
 */
export function generateSecureAdminToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * セキュアなアクセストークンを生成
 * 128ビット（16バイト）のエントロピーを持つBase64 URL-safeトークン
 * 個別投票用URLに使用
 *
 * @returns 22文字のBase64 URL-safeトークン
 */
export function generateSecureAccessToken(): string {
  return randomBytes(16).toString("base64url");
}

/**
 * トークンのエントロピーを検証
 * 最小限のセキュリティ要件を満たしているか確認
 *
 * @param token 検証するトークン
 * @param minBits 最小ビット数（デフォルト: 128）
 * @returns エントロピーが十分かどうか
 */
export function validateTokenEntropy(
  token: string,
  minBits: number = 128
): boolean {
  // Base64 URL-safeは6ビット/文字
  const estimatedBits = token.length * 6;
  return estimatedBits >= minBits;
}

/**
 * トークンが有効なBase64 URL-safe形式かチェック
 *
 * @param token 検証するトークン
 * @returns 有効な形式かどうか
 */
export function isValidTokenFormat(token: string): boolean {
  // Base64 URL-safeの文字セット: A-Z, a-z, 0-9, -, _
  const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
  return base64UrlPattern.test(token);
}

/**
 * UUIDv4形式のトークンを生成
 * Prismaのデフォルト@default(uuid())との互換性用
 *
 * @returns UUIDv4形式の文字列
 */
export function generateUuidToken(): string {
  const bytes = randomBytes(16);

  // UUIDv4の形式に変換
  // バージョン4を示すために、7番目のバイトの上位4ビットを0100に設定
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // バリアント（RFC 4122）を示すために、9番目のバイトの上位2ビットを10に設定
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // UUID形式にフォーマット
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * 短いランダム識別子を生成
 * 人間が読みやすい形式（数字とアルファベット）
 *
 * @param length 文字数（デフォルト: 8）
 * @returns ランダム識別子
 */
export function generateShortId(length: number = 8): string {
  // 読み間違えやすい文字を除外（0, O, 1, I, l）
  const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  const bytes = randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }

  return result;
}
