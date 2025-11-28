"use server";

/**
 * 投票候補管理用 Server Actions
 *
 * 投票候補（Subject）の作成、更新、削除を提供します。
 * すべての操作にadminToken認証が必要です。
 *
 * @module lib/actions/subject
 */

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { createSubjectSchema, updateSubjectSchema } from "@/lib/validations";

/**
 * 投票候補作成の入力データ型
 */
export type CreateSubjectInput = {
  /** イベントID */
  eventId: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 参照URL */
  url?: string;
  /** 画像URL */
  imageUrl?: string;
};

/**
 * 投票候補更新の入力データ型
 */
export type UpdateSubjectInput = {
  /** タイトル */
  title?: string;
  /** 説明 */
  description?: string;
  /** 参照URL */
  url?: string;
  /** 画像URL */
  imageUrl?: string;
  /** 表示順序 */
  order?: number;
};

/**
 * 投票候補操作の結果型
 */
type SubjectResult =
  | {
      success: true;
      subject: {
        id: string;
        title: string;
        description: string | null;
        url: string | null;
        imageUrl: string | null;
        order: number;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * 投票候補を作成するServer Action
 *
 * イベントに新しい投票候補を追加します。
 * イベントがロック済みまたは投票開始後は追加できません。
 *
 * @param eventId - イベントID
 * @param adminToken - 管理用トークン
 * @param input - 投票候補データ
 * @returns 成功時は作成された候補情報、失敗時はエラーメッセージ
 *
 * @example
 * ```ts
 * const result = await createSubject(eventId, adminToken, {
 *   eventId,
 *   title: "新しい選択肢",
 *   description: "この選択肢の説明",
 * });
 * ```
 */
export async function createSubject(
  eventId: string,
  adminToken: string,
  input: CreateSubjectInput
): Promise<SubjectResult> {
  const t = await getTranslations("errors");

  // 1. イベントの存在確認とadminToken検証
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      adminToken: true,
      isLocked: true,
      votes: { select: { id: true }, take: 1 },
      subjects: {
        select: { order: true },
        orderBy: { order: "desc" },
        take: 1,
      },
    },
  });

  if (!event || event.adminToken !== adminToken) {
    return { success: false, error: t("noPermission") };
  }

  // 2. ロック済みまたは投票開始後は追加不可
  if (event.isLocked) {
    return { success: false, error: t("cannotModifyLockedEvent") };
  }
  if (event.votes.length > 0) {
    return { success: false, error: t("cannotModifyAfterVoting") };
  }

  // 3. バリデーション
  const parsed = createSubjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? t("validation"),
    };
  }

  // 4. 順序の決定（最後尾に追加）
  const maxOrder = event.subjects[0]?.order ?? -1;
  const newOrder = maxOrder + 1;

  // 5. 作成
  try {
    const subject = await prisma.subject.create({
      data: {
        eventId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        url: parsed.data.url ?? null,
        imageUrl: parsed.data.imageUrl ?? null,
        order: newOrder,
      },
    });

    return { success: true, subject };
  } catch (error) {
    console.error("Failed to create subject:", error);
    return { success: false, error: t("subjectCreateFailed") };
  }
}

/**
 * 投票候補を更新するServer Action
 *
 * 既存の投票候補の情報を更新します。
 * イベントがロック済みまたは投票開始後は更新できません。
 *
 * @param eventId - イベントID
 * @param adminToken - 管理用トークン
 * @param subjectId - 投票候補ID
 * @param input - 更新データ
 * @returns 成功/失敗の結果
 *
 * @example
 * ```ts
 * const result = await updateSubject(eventId, adminToken, subjectId, {
 *   title: "更新後のタイトル",
 *   order: 2,
 * });
 * ```
 */
export async function updateSubject(
  eventId: string,
  adminToken: string,
  subjectId: string,
  input: UpdateSubjectInput
): Promise<{ success: true } | { success: false; error: string }> {
  const t = await getTranslations("errors");

  // 1. イベントの存在確認とadminToken検証
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      adminToken: true,
      isLocked: true,
      votes: { select: { id: true }, take: 1 },
    },
  });

  if (!event || event.adminToken !== adminToken) {
    return { success: false, error: t("noPermission") };
  }

  // 2. ロック済みまたは投票開始後は更新不可
  if (event.isLocked) {
    return { success: false, error: t("cannotModifyLockedEvent") };
  }
  if (event.votes.length > 0) {
    return { success: false, error: t("cannotModifyAfterVoting") };
  }

  // 3. バリデーション
  const parsed = updateSubjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? t("validation"),
    };
  }

  // 4. 更新
  try {
    await prisma.subject.update({
      where: { id: subjectId },
      data: {
        ...(parsed.data.title && { title: parsed.data.title }),
        ...(parsed.data.description !== undefined && {
          description: parsed.data.description ?? null,
        }),
        ...(parsed.data.url !== undefined && { url: parsed.data.url ?? null }),
        ...(parsed.data.imageUrl !== undefined && {
          imageUrl: parsed.data.imageUrl ?? null,
        }),
        ...(parsed.data.order !== undefined && { order: parsed.data.order }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update subject:", error);
    return { success: false, error: t("subjectUpdateFailed") };
  }
}

/**
 * 投票候補を削除するServer Action
 *
 * イベントから投票候補を削除します。
 * イベントがロック済みまたは投票開始後は削除できません。
 *
 * @param eventId - イベントID
 * @param adminToken - 管理用トークン
 * @param subjectId - 投票候補ID
 * @returns 成功/失敗の結果
 *
 * @example
 * ```ts
 * const result = await deleteSubject(eventId, adminToken, subjectId);
 * if (result.success) {
 *   console.log("Subject deleted");
 * }
 * ```
 */
export async function deleteSubject(
  eventId: string,
  adminToken: string,
  subjectId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const t = await getTranslations("errors");

  // 1. イベントの存在確認とadminToken検証
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      adminToken: true,
      isLocked: true,
      votes: { select: { id: true }, take: 1 },
    },
  });

  if (!event || event.adminToken !== adminToken) {
    return { success: false, error: t("noPermission") };
  }

  // 2. ロック済みまたは投票開始後は削除不可
  if (event.isLocked) {
    return { success: false, error: t("cannotModifyLockedEvent") };
  }
  if (event.votes.length > 0) {
    return { success: false, error: t("cannotModifyAfterVoting") };
  }

  // 3. 削除
  try {
    await prisma.subject.delete({
      where: { id: subjectId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete subject:", error);
    return { success: false, error: t("subjectDeleteFailed") };
  }
}
