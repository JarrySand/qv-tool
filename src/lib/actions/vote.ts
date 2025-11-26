"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { submitVoteSchema, validateVoteCost } from "@/lib/validations";
import { checkVoteRateLimit, getClientIp } from "@/lib/rate-limit";

export type SubmitVoteResult =
  | { success: true; voteId: string }
  | { success: false; error: string };

interface SubmitVoteInput {
  eventId: string;
  details: { subjectId: string; amount: number }[];
  token?: string;
  existingVoteId?: string;
}

/**
 * 投票を送信または更新するServer Action
 */
export async function submitVote(input: SubmitVoteInput): Promise<SubmitVoteResult> {
  const t = await getTranslations("errors");
  const { eventId, details, token, existingVoteId } = input;

  // 0. レート制限チェック
  const headersList = await headers();
  const clientIp = getClientIp(headersList);
  const rateLimitResult = await checkVoteRateLimit(clientIp);

  if (!rateLimitResult.success) {
    const secondsUntilReset = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
    return {
      success: false,
      error: t("rateLimitExceeded", { seconds: secondsUntilReset }),
    };
  }

  // 1. バリデーション
  const parsed = submitVoteSchema.safeParse({
    eventId,
    details,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: t("validation"),
    };
  }

  // 2. イベント情報を取得
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      votingMode: true,
      creditsPerVoter: true,
      startDate: true,
      endDate: true,
      subjects: {
        select: { id: true },
      },
    },
  });

  if (!event) {
    return { success: false, error: t("eventNotFound") };
  }

  // 3. 投票期間チェック
  const now = new Date();
  if (now < event.startDate) {
    return { success: false, error: t("votingNotStarted") };
  }
  if (now > event.endDate) {
    return { success: false, error: t("votingEnded") };
  }

  // 4. 投票対象の存在確認
  const validSubjectIds = new Set(event.subjects.map((s) => s.id));
  for (const detail of details) {
    if (!validSubjectIds.has(detail.subjectId)) {
      return { success: false, error: t("invalidSubject") };
    }
  }

  // 5. クレジットチェック
  const costValidation = validateVoteCost(details, event.creditsPerVoter);
  if (!costValidation.valid) {
    return {
      success: false,
      error: t("creditsExceeded", { used: costValidation.totalCost, limit: event.creditsPerVoter }),
    };
  }

  // 6. 認証チェックと投票者情報の取得
  let userId: string | null = null;
  let accessTokenId: string | null = null;

  if (event.votingMode === "individual") {
    // 個別投票モード
    if (!token) {
      return { success: false, error: t("tokenRequired") };
    }

    const accessToken = await prisma.accessToken.findFirst({
      where: {
        eventId,
        token,
      },
      select: {
        id: true,
        vote: { select: { id: true } },
      },
    });

    if (!accessToken) {
      return { success: false, error: t("invalidToken") };
    }

    // 既存の投票がある場合、更新モードかチェック
    if (accessToken.vote && !existingVoteId) {
      return {
        success: false,
        error: t("tokenAlreadyUsed"),
      };
    }

    accessTokenId = accessToken.id;
  } else {
    // Social認証モード
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: t("loginRequired") };
    }

    userId = session.user.id;

    // 既存の投票確認（更新モードでない場合）
    if (!existingVoteId) {
      const existingVote = await prisma.vote.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        select: { id: true },
      });

      if (existingVote) {
        return {
          success: false,
          error: t("alreadyVoted"),
        };
      }
    }
  }

  // 7. 投票の作成または更新
  try {
    const voteData = details.map((d) => ({
      subjectId: d.subjectId,
      amount: d.amount,
      cost: d.amount * d.amount,
    }));

    if (existingVoteId) {
      // 更新モード
      const existingVote = await prisma.vote.findUnique({
        where: { id: existingVoteId },
        select: {
          id: true,
          eventId: true,
          userId: true,
          accessTokenId: true,
        },
      });

      if (!existingVote || existingVote.eventId !== eventId) {
        return { success: false, error: t("voteNotFound") };
      }

      // 権限チェック
      if (event.votingMode === "individual") {
        if (existingVote.accessTokenId !== accessTokenId) {
          return { success: false, error: t("noPermissionToEdit") };
        }
      } else {
        if (existingVote.userId !== userId) {
          return { success: false, error: t("noPermissionToEdit") };
        }
      }

      // トランザクションで更新
      await prisma.$transaction(async (tx) => {
        // 既存の詳細を削除
        await tx.voteDetail.deleteMany({
          where: { voteId: existingVoteId },
        });

        // 新しい詳細を作成
        await tx.voteDetail.createMany({
          data: voteData.map((d) => ({
            voteId: existingVoteId,
            ...d,
          })),
        });

        // 更新日時を更新
        await tx.vote.update({
          where: { id: existingVoteId },
          data: { updatedAt: new Date() },
        });
      });

      return { success: true, voteId: existingVoteId };
    } else {
      // 新規作成
      const vote = await prisma.$transaction(async (tx) => {
        // 投票を作成
        const newVote = await tx.vote.create({
          data: {
            eventId,
            userId,
            accessTokenId,
            details: {
              create: voteData,
            },
          },
          select: { id: true },
        });

        // 個別投票の場合、トークンを使用済みにマーク
        if (accessTokenId) {
          await tx.accessToken.update({
            where: { id: accessTokenId },
            data: { isUsed: true },
          });
        }

        return newVote;
      });

      return { success: true, voteId: vote.id };
    }
  } catch (error) {
    console.error("Failed to submit vote:", error);
    return {
      success: false,
      error: t("submitVoteFailed"),
    };
  }
}

/**
 * 既存の投票データを取得
 */
export async function getExistingVote(
  eventId: string,
  token?: string
): Promise<{
  voteId: string;
  details: { subjectId: string; amount: number }[];
} | null> {
  // イベント情報を取得
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { votingMode: true },
  });

  if (!event) return null;

  let vote;

  if (event.votingMode === "individual") {
    if (!token) return null;

    const accessToken = await prisma.accessToken.findFirst({
      where: { eventId, token },
      select: { id: true },
    });

    if (!accessToken) return null;

    vote = await prisma.vote.findUnique({
      where: { accessTokenId: accessToken.id },
      include: {
        details: {
          select: { subjectId: true, amount: true },
        },
      },
    });
  } else {
    const session = await auth();
    if (!session?.user?.id) return null;

    vote = await prisma.vote.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
      include: {
        details: {
          select: { subjectId: true, amount: true },
        },
      },
    });
  }

  if (!vote) return null;

  return {
    voteId: vote.id,
    details: vote.details,
  };
}

