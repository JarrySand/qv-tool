import { describe, it, expect } from "vitest";
import { submitVoteSchema, validateVoteCost } from "./vote";

describe("投票バリデーション", () => {
  describe("submitVoteSchema", () => {
    const validInput = {
      eventId: "clx123456789012345678901",
      details: [
        { subjectId: "clx123456789012345678901", amount: 3 },
        { subjectId: "clx123456789012345678902", amount: 2 },
      ],
    };

    it("有効な入力を受け入れる", () => {
      const result = submitVoteSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("1つの投票詳細でも受け入れる", () => {
      const result = submitVoteSchema.safeParse({
        eventId: "clx123456789012345678901",
        details: [{ subjectId: "clx123456789012345678901", amount: 1 }],
      });
      expect(result.success).toBe(true);
    });

    it("0票の投票も受け入れる", () => {
      const result = submitVoteSchema.safeParse({
        eventId: "clx123456789012345678901",
        details: [{ subjectId: "clx123456789012345678901", amount: 0 }],
      });
      expect(result.success).toBe(true);
    });

    describe("eventIdのバリデーション", () => {
      it("無効なCUIDを拒否する", () => {
        const result = submitVoteSchema.safeParse({
          ...validInput,
          eventId: "invalid-id",
        });
        expect(result.success).toBe(false);
      });

      it("空のeventIdを拒否する", () => {
        const result = submitVoteSchema.safeParse({
          ...validInput,
          eventId: "",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("detailsのバリデーション", () => {
      it("空の配列を拒否する", () => {
        const result = submitVoteSchema.safeParse({
          eventId: "clx123456789012345678901",
          details: [],
        });
        expect(result.success).toBe(false);
      });

      it("無効なsubjectIdを拒否する", () => {
        const result = submitVoteSchema.safeParse({
          eventId: "clx123456789012345678901",
          details: [{ subjectId: "invalid", amount: 1 }],
        });
        expect(result.success).toBe(false);
      });

      it("負の票数を拒否する", () => {
        const result = submitVoteSchema.safeParse({
          eventId: "clx123456789012345678901",
          details: [{ subjectId: "clx123456789012345678901", amount: -1 }],
        });
        expect(result.success).toBe(false);
      });

      it("小数の票数を拒否する", () => {
        const result = submitVoteSchema.safeParse({
          eventId: "clx123456789012345678901",
          details: [{ subjectId: "clx123456789012345678901", amount: 1.5 }],
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("validateVoteCost", () => {
    describe("基本的なコスト計算", () => {
      it("空の投票は0コスト", () => {
        const result = validateVoteCost([], 100);
        expect(result).toEqual({
          valid: true,
          totalCost: 0,
          remaining: 100,
        });
      });

      it("1票 = 1クレジット", () => {
        const result = validateVoteCost([{ amount: 1 }], 100);
        expect(result).toEqual({
          valid: true,
          totalCost: 1,
          remaining: 99,
        });
      });

      it("2票 = 4クレジット", () => {
        const result = validateVoteCost([{ amount: 2 }], 100);
        expect(result).toEqual({
          valid: true,
          totalCost: 4,
          remaining: 96,
        });
      });

      it("3票 = 9クレジット", () => {
        const result = validateVoteCost([{ amount: 3 }], 100);
        expect(result).toEqual({
          valid: true,
          totalCost: 9,
          remaining: 91,
        });
      });

      it("10票 = 100クレジット", () => {
        const result = validateVoteCost([{ amount: 10 }], 100);
        expect(result).toEqual({
          valid: true,
          totalCost: 100,
          remaining: 0,
        });
      });
    });

    describe("複数候補への投票", () => {
      it("複数の投票のコストを合計する", () => {
        // 3票(9) + 2票(4) = 13クレジット
        const result = validateVoteCost([{ amount: 3 }, { amount: 2 }], 100);
        expect(result).toEqual({
          valid: true,
          totalCost: 13,
          remaining: 87,
        });
      });

      it("多数の候補への投票", () => {
        // 1票(1) + 2票(4) + 3票(9) + 1票(1) = 15クレジット
        const result = validateVoteCost(
          [{ amount: 1 }, { amount: 2 }, { amount: 3 }, { amount: 1 }],
          100
        );
        expect(result).toEqual({
          valid: true,
          totalCost: 15,
          remaining: 85,
        });
      });

      it("0票は計算に影響しない", () => {
        const result = validateVoteCost(
          [{ amount: 3 }, { amount: 0 }, { amount: 2 }],
          100
        );
        expect(result).toEqual({
          valid: true,
          totalCost: 13,
          remaining: 87,
        });
      });
    });

    describe("クレジット制限のチェック", () => {
      it("ちょうどクレジット上限で valid = true", () => {
        const result = validateVoteCost([{ amount: 10 }], 100);
        expect(result.valid).toBe(true);
        expect(result.remaining).toBe(0);
      });

      it("クレジット超過で valid = false", () => {
        const result = validateVoteCost([{ amount: 11 }], 100);
        expect(result.valid).toBe(false);
        expect(result.totalCost).toBe(121);
        expect(result.remaining).toBe(-21);
      });

      it("複数候補でクレジット超過", () => {
        // 5票(25) + 5票(25) + 5票(25) + 5票(25) = 100、さらに1票追加で超過
        const result = validateVoteCost(
          [{ amount: 5 }, { amount: 5 }, { amount: 5 }, { amount: 6 }],
          100
        );
        expect(result.valid).toBe(false);
        expect(result.totalCost).toBe(111); // 25 + 25 + 25 + 36
      });

      it("少ないクレジットでのテスト", () => {
        // 10クレジットで3票(9)は可能
        const result1 = validateVoteCost([{ amount: 3 }], 10);
        expect(result1.valid).toBe(true);
        expect(result1.remaining).toBe(1);

        // 10クレジットで4票(16)は不可
        const result2 = validateVoteCost([{ amount: 4 }], 10);
        expect(result2.valid).toBe(false);
      });
    });

    describe("エッジケース", () => {
      it("大きな票数", () => {
        const result = validateVoteCost([{ amount: 100 }], 10000);
        expect(result).toEqual({
          valid: true,
          totalCost: 10000,
          remaining: 0,
        });
      });

      it("クレジット1での投票", () => {
        // 1クレジットでは1票のみ可能
        const result1 = validateVoteCost([{ amount: 1 }], 1);
        expect(result1.valid).toBe(true);

        const result2 = validateVoteCost([{ amount: 2 }], 1);
        expect(result2.valid).toBe(false);
      });

      it("すべて0票の場合", () => {
        const result = validateVoteCost(
          [{ amount: 0 }, { amount: 0 }, { amount: 0 }],
          100
        );
        expect(result).toEqual({
          valid: true,
          totalCost: 0,
          remaining: 100,
        });
      });
    });
  });
});
