"use server";

import { prisma } from "@/lib/db";
import {
  createEventSchema,
  updateEventSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validations";
import { generateSlug, sanitizeSlug } from "@/lib/utils/slug";

export type CreateEventResult =
  | {
      success: true;
      event: {
        id: string;
        slug: string | null;
        title: string;
        adminToken: string;
      };
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

/**
 * イベントを作成するServer Action
 * 認証不要：誰でもイベントを作成可能
 */
export async function createEvent(
  input: CreateEventInput
): Promise<CreateEventResult> {
  // 1. バリデーション
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "unknown";
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors,
    };
  }

  const data = parsed.data;

  // 2. 日付の妥当性チェック
  if (data.endDate <= data.startDate) {
    return {
      success: false,
      error: "終了日は開始日より後の日付を指定してください",
      fieldErrors: {
        endDate: ["終了日は開始日より後の日付を指定してください"],
      },
    };
  }

  // 3. slugの処理
  let slug: string | null = null;
  if (data.slug) {
    // カスタムslugの指定あり
    const sanitized = sanitizeSlug(data.slug);
    // 重複チェック
    const existing = await prisma.event.findUnique({
      where: { slug: sanitized },
      select: { id: true },
    });
    if (existing) {
      return {
        success: false,
        error: "このスラッグは既に使用されています",
        fieldErrors: {
          slug: ["このスラッグは既に使用されています"],
        },
      };
    }
    slug = sanitized;
  } else {
    // 自動生成
    let attempts = 0;
    while (attempts < 5) {
      const generated = generateSlug();
      const existing = await prisma.event.findUnique({
        where: { slug: generated },
        select: { id: true },
      });
      if (!existing) {
        slug = generated;
        break;
      }
      attempts++;
    }
    // 5回試行して全て重複した場合はslugなしで作成（idでアクセス可能）
  }

  // 4. イベント作成
  try {
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        slug,
        startDate: data.startDate,
        endDate: data.endDate,
        creditsPerVoter: data.creditsPerVoter,
        votingMode: data.votingMode,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        adminToken: true,
      },
    });

    return {
      success: true,
      event,
    };
  } catch (error) {
    console.error("Failed to create event:", error);
    return {
      success: false,
      error: "イベントの作成に失敗しました。しばらく経ってから再度お試しください。",
    };
  }
}

/**
 * イベントを取得する（adminToken認証）
 */
export async function getEventForAdmin(eventId: string, adminToken: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      subjects: {
        orderBy: { order: "asc" },
      },
      votes: {
        select: { id: true },
      },
      accessTokens: {
        select: { id: true, isUsed: true },
      },
    },
  });

  if (!event || event.adminToken !== adminToken) {
    return null;
  }

  return event;
}

export type UpdateEventResult =
  | { success: true }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

/**
 * イベントを更新するServer Action
 * adminTokenによる認証が必要
 */
export async function updateEvent(
  eventId: string,
  adminToken: string,
  input: UpdateEventInput
): Promise<UpdateEventResult> {
  // 1. イベントの存在確認とadminToken検証
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      adminToken: true,
      votes: { select: { id: true }, take: 1 },
    },
  });

  if (!event || event.adminToken !== adminToken) {
    return {
      success: false,
      error: "イベントが見つからないか、アクセス権限がありません",
    };
  }

  // 2. バリデーション
  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "unknown";
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors,
    };
  }

  const data = parsed.data;

  // 3. 日付の妥当性チェック（両方指定されている場合）
  if (data.startDate && data.endDate && data.endDate <= data.startDate) {
    return {
      success: false,
      error: "終了日は開始日より後の日付を指定してください",
      fieldErrors: {
        endDate: ["終了日は開始日より後の日付を指定してください"],
      },
    };
  }

  // 4. 更新実行
  try {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update event:", error);
    return {
      success: false,
      error: "イベントの更新に失敗しました",
    };
  }
}

/**
 * イベントに投票があるかチェック（投票開始後の編集制限用）
 */
export async function hasVotes(eventId: string): Promise<boolean> {
  const count = await prisma.vote.count({
    where: { eventId },
  });
  return count > 0;
}

