import { z } from "zod";

// 投票詳細スキーマ
const voteDetailSchema = z.object({
  subjectId: z.string().cuid(),
  amount: z.number().int().min(0, "票数は0以上で入力してください"),
});

// 投票送信スキーマ
export const submitVoteSchema = z.object({
  eventId: z.string().cuid(),
  details: z
    .array(voteDetailSchema)
    .min(1, "少なくとも1つの投票対象を選択してください"),
});

// バリデーション: 総コストがクレジットを超えていないか
export const validateVoteCost = (
  details: { amount: number }[],
  maxCredits: number
): { valid: boolean; totalCost: number; remaining: number } => {
  const totalCost = details.reduce((sum, d) => sum + d.amount * d.amount, 0);
  return {
    valid: totalCost <= maxCredits,
    totalCost,
    remaining: maxCredits - totalCost,
  };
};

export type SubmitVoteInput = z.infer<typeof submitVoteSchema>;
export type VoteDetailInput = z.infer<typeof voteDetailSchema>;
