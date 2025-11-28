import { randomBytes } from "crypto";

/**
 * URL用のランダムなslugを生成する
 * 形式: 8文字の英小文字・数字のランダム文字列
 */
export function generateSlug(): string {
  return randomBytes(4).toString("hex");
}

/**
 * slugをサニタイズする（小文字化、無効文字の削除）
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 管理用トークンを生成する（UUID v4相当）
 * Prismaスキーマで@default(uuid())が設定されているが、
 * Server Actionから明示的に生成する場合に使用
 */
export function generateAdminToken(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}
