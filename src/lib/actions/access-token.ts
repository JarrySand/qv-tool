"use server";

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";

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
 * トークンを検証するServer Action
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
