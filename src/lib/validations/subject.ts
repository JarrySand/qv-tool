import { z } from "zod";

// 投票対象作成スキーマ
export const createSubjectSchema = z.object({
  eventId: z.string().cuid(),
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  description: z
    .string()
    .max(1000, "説明は1000文字以内で入力してください")
    .optional(),
  url: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
  imageUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
  order: z.number().int().min(0).default(0),
});

// 投票対象更新スキーマ
export const updateSubjectSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください")
    .optional(),
  description: z
    .string()
    .max(1000, "説明は1000文字以内で入力してください")
    .optional(),
  url: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
  imageUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
  order: z.number().int().min(0).optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;

