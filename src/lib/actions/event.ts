"use server";

/**
 * イベント管理用 Server Actions
 *
 * イベントの作成、更新、取得、公開などの操作を提供します。
 * すべての関数はサーバーサイドで実行され、Prismaを使用してDBと通信します。
 *
 * @module lib/actions/event
 */

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import {
  createEventSchema,
  updateEventSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validations";
import { generateSlug, sanitizeSlug } from "@/lib/utils/slug";
import { checkEventCreateRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * イベント作成の結果型
 */
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
 *
 * 認証不要で誰でもイベントを作成可能。
 * レート制限、バリデーション、スラッグの自動生成を行います。
 *
 * @param input - イベント作成の入力データ
 * @returns 成功時はイベント情報、失敗時はエラーメッセージ
 *
 * @example
 * ```ts
 * const result = await createEvent({
 *   title: "新しい投票",
 *   startDate: new Date(),
 *   endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
 *   creditsPerVoter: 100,
 *   votingMode: "google",
 * });
 *
 * if (result.success) {
 *   console.log(`Created: ${result.event.id}`);
 * }
 * ```
 */
export async function createEvent(
  input: CreateEventInput
): Promise<CreateEventResult> {
  const t = await getTranslations("errors");

  // 0. レート制限チェック
  const headersList = await headers();
  const clientIp = getClientIp(headersList);
  const rateLimitResult = await checkEventCreateRateLimit(clientIp);

  if (!rateLimitResult.success) {
    const secondsUntilReset = Math.ceil(
      (rateLimitResult.reset - Date.now()) / 1000
    );
    return {
      success: false,
      error: t("rateLimitExceeded", { seconds: secondsUntilReset }),
    };
  }

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
      error: t("validation"),
      fieldErrors,
    };
  }

  const data = parsed.data;

  // 2. 日付の妥当性チェック
  if (data.endDate <= data.startDate) {
    return {
      success: false,
      error: t("endDateBeforeStart"),
      fieldErrors: {
        endDate: [t("endDateBeforeStart")],
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
        error: t("slugAlreadyUsed"),
        fieldErrors: {
          slug: [t("slugAlreadyUsed")],
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
        // Discord ゲート機能用
        discordGuildId: data.discordGuildId ?? null,
        discordGuildName: data.discordGuildName ?? null,
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
      error: t("eventCreateFailed"),
    };
  }
}

/**
 * 管理者用にイベントを取得する
 *
 * adminTokenによる認証を行い、一致した場合のみイベント情報を返します。
 * 投票候補、投票数、アクセストークンの統計情報も含みます。
 *
 * @param eventId - イベントID
 * @param adminToken - 管理用トークン
 * @returns イベント情報（認証失敗時はnull）
 *
 * @example
 * ```ts
 * const event = await getEventForAdmin(eventId, adminToken);
 * if (!event) {
 *   return { error: "Not found or unauthorized" };
 * }
 * ```
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

/**
 * イベント更新の結果型
 */
export type UpdateEventResult =
  | { success: true }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

/**
 * イベントを更新するServer Action
 *
 * adminTokenによる認証が必要です。
 * タイトル、説明、開始・終了日時の更新が可能です。
 * 投票候補、クレジット数、認証方式は公開後は変更できません。
 *
 * @param eventId - イベントID
 * @param adminToken - 管理用トークン
 * @param input - 更新データ
 * @returns 成功/失敗の結果
 *
 * @example
 * ```ts
 * const result = await updateEvent(eventId, adminToken, {
 *   title: "更新後のタイトル",
 *   description: "更新後の説明",
 * });
 * ```
 */
export async function updateEvent(
  eventId: string,
  adminToken: string,
  input: UpdateEventInput
): Promise<UpdateEventResult> {
  const t = await getTranslations("errors");

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
      error: t("eventNotFoundOrNoAccess"),
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
      error: t("validation"),
      fieldErrors,
    };
  }

  const data = parsed.data;

  // 3. 日付の妥当性チェック（両方指定されている場合）
  if (data.startDate && data.endDate && data.endDate <= data.startDate) {
    return {
      success: false,
      error: t("endDateBeforeStart"),
      fieldErrors: {
        endDate: [t("endDateBeforeStart")],
      },
    };
  }

  // 4. 更新実行
  try {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update event:", error);
    return {
      success: false,
      error: t("eventUpdateFailed"),
    };
  }
}

/**
 * イベントに投票があるかチェックする
 *
 * 投票開始後の編集制限判定に使用します。
 *
 * @param eventId - イベントID
 * @returns 投票が存在する場合はtrue
 */
export async function hasVotes(eventId: string): Promise<boolean> {
  const count = await prisma.vote.count({
    where: { eventId },
  });
  return count > 0;
}

// ============================================
// ワンストップ作成機能
// ============================================

/**
 * 投票候補の入力データ型
 */
export type SubjectInput = {
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 参照URL */
  url?: string;
};

/**
 * イベント＋投票候補一括作成の入力データ型
 */
export type CreateEventWithSubjectsInput = CreateEventInput & {
  /** 投票候補の配列 */
  subjects: SubjectInput[];
};

/**
 * イベント＋投票候補一括作成の結果型
 */
export type CreateEventWithSubjectsResult =
  | {
      success: true;
      event: {
        id: string;
        slug: string | null;
        title: string;
        adminToken: string;
        startDate: Date;
        endDate: Date;
        creditsPerVoter: number;
        votingMode: string;
        subjects: { id: string; title: string; description: string | null }[];
      };
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

/**
 * イベントと投票候補を一括作成するServer Action
 *
 * ウィザード形式のワンストップ作成フロー用。
 * トランザクションで一括作成し、作成時点でロック状態にします。
 *
 * @param input - イベントと投票候補の入力データ
 * @returns 成功時はイベント情報、失敗時はエラーメッセージ
 *
 * @example
 * ```ts
 * const result = await createEventWithSubjects({
 *   title: "新しい投票",
 *   startDate: new Date(),
 *   endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
 *   creditsPerVoter: 100,
 *   votingMode: "individual",
 *   subjects: [
 *     { title: "選択肢A", description: "説明A" },
 *     { title: "選択肢B", description: "説明B" },
 *   ],
 * });
 * ```
 */
export async function createEventWithSubjects(
  input: CreateEventWithSubjectsInput
): Promise<CreateEventWithSubjectsResult> {
  const t = await getTranslations("errors");

  // 0. レート制限チェック
  const headersList = await headers();
  const clientIp = getClientIp(headersList);
  const rateLimitResult = await checkEventCreateRateLimit(clientIp);

  if (!rateLimitResult.success) {
    const secondsUntilReset = Math.ceil(
      (rateLimitResult.reset - Date.now()) / 1000
    );
    return {
      success: false,
      error: t("rateLimitExceeded", { seconds: secondsUntilReset }),
    };
  }

  // 1. 投票候補が最低1つあるかチェック
  if (!input.subjects || input.subjects.length === 0) {
    return {
      success: false,
      error: t("validation"),
      fieldErrors: {
        subjects: [t("subjectsRequired")],
      },
    };
  }

  // 2. 基本情報のバリデーション
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
      error: t("validation"),
      fieldErrors,
    };
  }

  const data = parsed.data;

  // 3. 日付の妥当性チェック
  if (data.endDate <= data.startDate) {
    return {
      success: false,
      error: t("endDateBeforeStart"),
      fieldErrors: {
        endDate: [t("endDateBeforeStart")],
      },
    };
  }

  // 4. slugの処理
  let slug: string | null = null;
  if (data.slug) {
    const sanitized = sanitizeSlug(data.slug);
    const existing = await prisma.event.findUnique({
      where: { slug: sanitized },
      select: { id: true },
    });
    if (existing) {
      return {
        success: false,
        error: t("slugAlreadyUsed"),
        fieldErrors: {
          slug: [t("slugAlreadyUsed")],
        },
      };
    }
    slug = sanitized;
  } else {
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
  }

  // 5. トランザクションでイベントと投票候補を一括作成
  try {
    const event = await prisma.$transaction(async (tx) => {
      // イベント作成（ロック済み）
      const createdEvent = await tx.event.create({
        data: {
          title: data.title,
          description: data.description ?? null,
          slug,
          startDate: data.startDate,
          endDate: data.endDate,
          creditsPerVoter: data.creditsPerVoter,
          votingMode: data.votingMode,
          isLocked: true, // 公開時点でロック
          // Discord ゲート機能用
          discordGuildId: data.discordGuildId ?? null,
          discordGuildName: data.discordGuildName ?? null,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          adminToken: true,
          startDate: true,
          endDate: true,
          creditsPerVoter: true,
          votingMode: true,
        },
      });

      // 投票候補を一括作成
      const subjectData = input.subjects.map((subject, index) => ({
        eventId: createdEvent.id,
        title: subject.title,
        description: subject.description ?? null,
        url: subject.url ?? null,
        order: index,
      }));

      await tx.subject.createMany({
        data: subjectData,
      });

      // 作成した投票候補を取得
      const subjects = await tx.subject.findMany({
        where: { eventId: createdEvent.id },
        select: { id: true, title: true, description: true },
        orderBy: { order: "asc" },
      });

      return { ...createdEvent, subjects };
    });

    return {
      success: true,
      event,
    };
  } catch (error) {
    console.error("Failed to create event with subjects:", error);
    return {
      success: false,
      error: t("eventCreateFailed"),
    };
  }
}

/**
 * イベントを公開（ロック）するServer Action
 *
 * 一度公開すると投票候補、クレジット数、認証方式は変更できません。
 * 公開前に投票候補が最低1つ必要です。
 *
 * @param eventId - イベントID
 * @param adminToken - 管理用トークン
 * @returns 成功/失敗の結果
 *
 * @example
 * ```ts
 * const result = await publishEvent(eventId, adminToken);
 * if (result.success) {
 *   console.log("Event published!");
 * }
 * ```
 */
export async function publishEvent(
  eventId: string,
  adminToken: string
): Promise<{ success: true } | { success: false; error: string }> {
  const t = await getTranslations("errors");

  // 1. イベントの存在確認とadminToken検証
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      adminToken: true,
      isLocked: true,
      subjects: { select: { id: true } },
    },
  });

  if (!event || event.adminToken !== adminToken) {
    return { success: false, error: t("eventNotFoundOrNoAccess") };
  }

  // 2. 既にロック済み
  if (event.isLocked) {
    return { success: true }; // 既に公開済みなのでエラーにしない
  }

  // 3. 投票候補が最低1つあるかチェック
  if (event.subjects.length === 0) {
    return { success: false, error: t("validation") };
  }

  // 4. ロック実行
  try {
    await prisma.event.update({
      where: { id: eventId },
      data: { isLocked: true },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to publish event:", error);
    return { success: false, error: t("eventPublishFailed") };
  }
}
