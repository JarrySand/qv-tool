import { z } from "zod";

const Q1_OPTIONS = [
  "login",
  "credit_allocation",
  "ui",
  "confirm_method",
  "none",
  "other",
] as const;

/**
 * 投票後アンケート送信スキーマ。
 * フィールドは全て任意だが、文字列長と数値範囲を厳格に制限してスパム/濫用を防ぐ。
 */
export const submitSurveySchema = z.object({
  eventId: z.string().min(1).max(100),
  voteId: z.string().min(1).max(100).optional(),
  /** 個別投票方式の所有権確認用トークン (任意) */
  token: z.string().min(1).max(100).optional(),
  q1Difficulties: z.array(z.enum(Q1_OPTIONS)).max(Q1_OPTIONS.length).optional(),
  q1Other: z.string().max(500).optional(),
  q2CreditSatisfaction: z.number().int().min(1).max(5).optional(),
  q3QvPreference: z.number().int().min(1).max(5).optional(),
  q4Feedback: z.string().max(1000).optional(),
});

export type SubmitSurveyInput = z.infer<typeof submitSurveySchema>;
