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
    .union([
      z.literal(""),
      z.literal(undefined),
      z
        .string()
        .regex(
          /^[a-z0-9-]+$/,
          "スラッグは小文字英数字とハイフンのみ使用できます"
        )
        .min(3, "スラッグは3文字以上で入力してください")
        .max(50, "スラッグは50文字以内で入力してください"),
    ])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  creditsPerVoter: z
    .number()
    .int()
    .min(1, "クレジット数は1以上で入力してください")
    .max(1000, "クレジット数は1000以下で入力してください")
    .default(100),
  votingMode: z.enum(["individual", "google", "line", "discord"], {
    error: "認証方式を選択してください",
  }),
  // Discord ゲート機能用（votingMode === "discord" の場合のみ使用）
  discordGuildId: z
    .union([
      z.literal(""),
      z.literal(undefined),
      z.string().regex(/^\d{17,19}$/, "DiscordサーバーIDは17-19桁の数値です"),
    ])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  discordGuildName: z
    .string()
    .max(100, "サーバー名は100文字以内で入力してください")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  // Discord ロール制限機能用（discordGuildIdが設定されている場合のみ使用）
  discordRequiredRoleId: z
    .union([
      z.literal(""),
      z.literal(undefined),
      z.string().regex(/^\d{17,19}$/, "DiscordロールIDは17-19桁の数値です"),
    ])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  discordRequiredRoleName: z
    .string()
    .max(100, "ロール名は100文字以内で入力してください")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
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
