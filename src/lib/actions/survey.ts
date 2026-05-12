"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { submitSurveySchema } from "@/lib/validations";
import { checkVoteRateLimit, getClientIp } from "@/lib/rate-limit";

export type SubmitSurveyResult =
  | { success: true }
  | { success: false; error: string };

interface SubmitSurveyInput {
  eventId: string;
  voteId?: string;
  token?: string;
  q1Difficulties?: string[];
  q1Other?: string;
  q2CreditSatisfaction?: number;
  q3QvPreference?: number;
  q4Feedback?: string;
}

export async function submitSurvey(
  input: SubmitSurveyInput
): Promise<SubmitSurveyResult> {
  // 入力バリデーション
  const parsed = submitSurveySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }
  const {
    eventId,
    voteId,
    token,
    q1Difficulties,
    q1Other,
    q2CreditSatisfaction,
    q3QvPreference,
    q4Feedback,
  } = parsed.data;

  // レート制限（投票送信と同じバケットを共用してスパム送信を抑制）
  const headersList = await headers();
  const clientIp = getClientIp(headersList);
  const rateLimit = await checkVoteRateLimit(clientIp);
  if (!rateLimit.success) {
    const seconds = Math.ceil((rateLimit.reset - Date.now()) / 1000);
    return {
      success: false,
      error: `Too many requests. Try again in ${seconds}s.`,
    };
  }

  // イベント存在チェック
  const event = await prisma.event.findFirst({
    where: {
      OR: [{ id: eventId }, { slug: eventId }],
    },
    select: { id: true },
  });

  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // voteId が指定されている場合、所有権を確認する
  // - Social 認証の投票: 現在のセッションの user.id と一致するか
  // - 個別トークン方式の投票: クライアントが渡してきた token が
  //   vote.accessToken と一致するか
  // 所有権が一致しない投票への回答は受け付けない（なりすまし防止）。
  if (voteId) {
    const vote = await prisma.vote.findUnique({
      where: { id: voteId },
      select: {
        eventId: true,
        userId: true,
        accessToken: { select: { token: true } },
      },
    });

    if (!vote || vote.eventId !== event.id) {
      return { success: false, error: "Vote not found" };
    }

    if (vote.userId) {
      // Social 認証ルート
      const session = await auth();
      if (!session?.user?.id || session.user.id !== vote.userId) {
        return { success: false, error: "Unauthorized" };
      }
    } else if (vote.accessToken) {
      // 個別トークン方式ルート
      if (!token || token !== vote.accessToken.token) {
        return { success: false, error: "Unauthorized" };
      }
    } else {
      // ありえないが念のため
      return { success: false, error: "Vote has no owner" };
    }

    // 既に回答済みかチェック
    const existing = await prisma.surveyResponse.findUnique({
      where: { voteId },
      select: { id: true },
    });
    if (existing) {
      return { success: false, error: "Already submitted" };
    }
  }

  try {
    await prisma.surveyResponse.create({
      data: {
        eventId: event.id,
        voteId: voteId || null,
        q1Difficulties: q1Difficulties?.length
          ? q1Difficulties.join(",")
          : null,
        q1Other: q1Other || null,
        q2CreditSatisfaction: q2CreditSatisfaction ?? null,
        q3QvPreference: q3QvPreference ?? null,
        q4Feedback: q4Feedback || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to submit survey:", error);
    return { success: false, error: "Failed to submit survey" };
  }
}
