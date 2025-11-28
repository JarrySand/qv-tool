/**
 * スラッグ生成・サニタイズユーティリティ
 *
 * URL用のスラッグ（短い識別子）を生成・処理します。
 *
 * @module lib/utils/slug
 */

import { randomBytes } from "crypto";

/**
 * URL用のランダムなスラッグを生成する
 *
 * 暗号学的に安全なランダムバイトを使用して、
 * 8文字の16進数文字列を生成します。
 *
 * @returns 8文字の16進数文字列（例: "a1b2c3d4"）
 *
 * @example
 * ```ts
 * const slug = generateSlug();
 * console.log(slug); // "f7e8d9c0"
 * ```
 */
export function generateSlug(): string {
  return randomBytes(4).toString("hex");
}

/**
 * スラッグをサニタイズする
 *
 * ユーザー入力のスラッグを安全なURL形式に変換します。
 * - 小文字に変換
 * - 英小文字、数字、ハイフン以外を削除
 * - 連続するハイフンを1つに
 * - 先頭・末尾のハイフンを削除
 *
 * @param slug - サニタイズするスラッグ
 * @returns サニタイズされたスラッグ
 *
 * @example
 * ```ts
 * sanitizeSlug("My Event 2024!");  // "my-event-2024"
 * sanitizeSlug("Test--Slug---");   // "test-slug"
 * sanitizeSlug("日本語イベント");  // ""
 * ```
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 管理用トークンを生成する（UUID v4形式）
 *
 * 暗号学的に安全なランダムバイトを使用して、
 * UUID v4形式のトークンを生成します。
 *
 * @returns UUID v4形式の文字列（例: "550e8400-e29b-41d4-a716-446655440000"）
 *
 * @example
 * ```ts
 * const adminToken = generateAdminToken();
 * console.log(adminToken); // "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
 * ```
 *
 * @remarks
 * Prismaスキーマで@default(uuid())が設定されているため、
 * 通常はPrismaが自動生成します。
 * Server Actionから明示的に生成が必要な場合のみ使用してください。
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
