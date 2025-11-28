"use server";

/**
 * アクセストークン管理用 Server Actions
 *
 * 個別URL投票方式で使用するアクセストークンの生成・検証を提供します。
 *
 * @module lib/actions/access-token
 */

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";

/**
 * トークン生成の結果型
 */
type GenerateResult =
  | {
      success: true;
      tokens: {
        id: string;
        token: string;
        isUsed: boolean;
        createdAt: Date;
      }[];
    }
  | {
      success: false;
      error: string;
    };

/**
 * 個別投票用トークンを一括生成するServer Action
 *
 * 指定された数のアクセストークンを生成します。
 * 各トークンは1回のみ投票に使用可能です。
 *
 * @param eventId - イベントID
 * @param adminToken - 管理用トークン
 * @param count - 生成するトークン数（1-100）
 * @returns 成功時は生成されたトークン配列、失敗時はエラーメッセージ
 *
 * @example
 * ```ts
 * const result = await generateAccessTokens(eventId, adminToken, 10);
 * if (result.success) {
 *   // トークンをCSVやURLとして配布
 *   result.tokens.forEach(t => {
 *     console.log(`/events/${eventId}?token=${t.token}`);
 *   });
 * }
 * ```
 */
export async function generateAccessTokens(
  eventId: string,
  adminToken: string,
  count: number
): Promise<GenerateResult> {
  const t = await getTranslations("errors");

  // 1. バリデーション
  if (count < 1 || count > 100) {
    return { success: false, error: t("validation") };
  }

  // 2. イベントの存在確認とadminToken検証
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      adminToken: true,
      votingMode: true,
    },
  });

  if (!event || event.adminToken !== adminToken) {
    return { success: false, error: t("noPermission") };
  }

  if (event.votingMode !== "individual") {
    return { success: false, error: t("validation") };
  }

  // 3. トークン生成
  try {
    const tokens = await prisma.$transaction(
      Array.from({ length: count }, () =>
        prisma.accessToken.create({
          data: { eventId },
          select: { id: true, token: true, isUsed: true, createdAt: true },
        })
      )
    );

    return { success: true, tokens };
  } catch (error) {
    console.error("Failed to generate tokens:", error);
    return { success: false, error: t("tokenGenerateFailed") };
  }
}

/**
 * アクセストークンを検証するServer Action
 *
 * トークンの存在確認と使用状況をチェックします。
 *
 * @param eventId - イベントID
 * @param token - 検証するトークン
 * @returns 有効な場合はトークン情報、無効な場合はエラー
 *
 * @example
 * ```ts
 * const result = await validateAccessToken(eventId, token);
 * if (result.valid) {
 *   if (result.isUsed) {
 *     // 投票編集モード
 *   } else {
 *     // 新規投票モード
 *   }
 * }
 * ```
 */
export async function validateAccessToken(
  eventId: string,
  token: string
): Promise<
  | { valid: true; tokenId: string; isUsed: boolean }
  | { valid: false; error: string }
> {
  const t = await getTranslations("errors");

  const accessToken = await prisma.accessToken.findFirst({
    where: {
      eventId,
      token,
    },
    select: {
      id: true,
      isUsed: true,
    },
  });

  if (!accessToken) {
    return { valid: false, error: t("invalidToken") };
  }

  return { valid: true, tokenId: accessToken.id, isUsed: accessToken.isUsed };
}
