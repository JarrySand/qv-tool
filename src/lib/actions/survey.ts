"use server";

import { prisma } from "@/lib/db";

export type SubmitSurveyResult =
  | { success: true }
  | { success: false; error: string };

interface SubmitSurveyInput {
  eventId: string;
  voteId?: string;
  q1Difficulties?: string[];
  q1Other?: string;
  q2CreditSatisfaction?: number;
  q3QvPreference?: number;
  q4Feedback?: string;
}

export async function submitSurvey(
  input: SubmitSurveyInput
): Promise<SubmitSurveyResult> {
  const {
    eventId,
    voteId,
    q1Difficulties,
    q1Other,
    q2CreditSatisfaction,
    q4Feedback,
    q3QvPreference,
  } = input;

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

  // voteIdが指定されている場合、既に回答済みかチェック
  if (voteId) {
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
