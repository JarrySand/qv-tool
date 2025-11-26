"use server";

import { prisma } from "@/lib/db";
import { createSubjectSchema, updateSubjectSchema } from "@/lib/validations";

export type CreateSubjectInput = {
  eventId: string;
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
};

export type UpdateSubjectInput = {
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  order?: number;
};

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
 * 投票対象を作成するServer Action
 */
export async function createSubject(
  eventId: string,
  adminToken: string,
  input: CreateSubjectInput
): Promise<SubjectResult> {
  // 1. イベントの存在確認とadminToken検証
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      adminToken: true,
      votes: { select: { id: true }, take: 1 },
      subjects: { select: { order: true }, orderBy: { order: "desc" }, take: 1 },
    },
  });

  if (!event || event.adminToken !== adminToken) {
    return { success: false, error: "アクセス権限がありません" };
  }

  // 2. 投票開始後は追加不可
  if (event.votes.length > 0) {
    return { success: false, error: "投票開始後は投票対象を追加できません" };
  }

  // 3. バリデーション
  const parsed = createSubjectSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "入力エラー" };
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
    return { success: false, error: "投票対象の作成に失敗しました" };
  }
}

/**
 * 投票対象を更新するServer Action
 */
export async function updateSubject(
  eventId: string,
  adminToken: string,
  subjectId: string,
  input: UpdateSubjectInput
): Promise<{ success: true } | { success: false; error: string }> {
  // 1. イベントの存在確認とadminToken検証
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      adminToken: true,
      votes: { select: { id: true }, take: 1 },
    },
  });

  if (!event || event.adminToken !== adminToken) {
    return { success: false, error: "アクセス権限がありません" };
  }

  // 2. 投票開始後は更新不可
  if (event.votes.length > 0) {
    return { success: false, error: "投票開始後は投票対象を編集できません" };
  }

  // 3. バリデーション
  const parsed = updateSubjectSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "入力エラー" };
  }

  // 4. 更新
  try {
    await prisma.subject.update({
      where: { id: subjectId },
      data: {
        ...(parsed.data.title && { title: parsed.data.title }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description ?? null }),
        ...(parsed.data.url !== undefined && { url: parsed.data.url ?? null }),
        ...(parsed.data.imageUrl !== undefined && { imageUrl: parsed.data.imageUrl ?? null }),
        ...(parsed.data.order !== undefined && { order: parsed.data.order }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update subject:", error);
    return { success: false, error: "投票対象の更新に失敗しました" };
  }
}

/**
 * 投票対象を削除するServer Action
 */
export async function deleteSubject(
  eventId: string,
  adminToken: string,
  subjectId: string
): Promise<{ success: true } | { success: false; error: string }> {
  // 1. イベントの存在確認とadminToken検証
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      adminToken: true,
      votes: { select: { id: true }, take: 1 },
    },
  });

  if (!event || event.adminToken !== adminToken) {
    return { success: false, error: "アクセス権限がありません" };
  }

  // 2. 投票開始後は削除不可
  if (event.votes.length > 0) {
    return { success: false, error: "投票開始後は投票対象を削除できません" };
  }

  // 3. 削除
  try {
    await prisma.subject.delete({
      where: { id: subjectId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete subject:", error);
    return { success: false, error: "投票対象の削除に失敗しました" };
  }
}

