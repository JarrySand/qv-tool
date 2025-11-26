import { z } from "zod";

// イベント作成スキーマ
export const createEventSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  description: z
    .string()
    .max(2000, "説明は2000文字以内で入力してください")
    .optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "スラッグは小文字英数字とハイフンのみ使用できます")
    .min(3, "スラッグは3文字以上で入力してください")
    .max(50, "スラッグは50文字以内で入力してください")
    .optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  creditsPerVoter: z
    .number()
    .int()
    .min(1, "クレジット数は1以上で入力してください")
    .max(1000, "クレジット数は1000以下で入力してください")
    .default(100),
  votingMode: z.enum(["individual", "google", "line"], {
    errorMap: () => ({ message: "認証方式を選択してください" }),
  }),
});

// イベント更新スキーマ（投票開始後は一部フィールドが変更不可）
export const updateEventSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください")
    .optional(),
  description: z
    .string()
    .max(2000, "説明は2000文字以内で入力してください")
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

