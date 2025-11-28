import { describe, it, expect } from "vitest";
import {
  calculateCost,
  calculateMaxVotes,
  calculateTotalCost,
  calculateRemainingCredits,
  calculateMaxAdditionalVotes,
  canChangeVote,
} from "./qv";

describe("QV計算ユーティリティ", () => {
  describe("calculateCost", () => {
    it("票数の二乗がコストになる", () => {
      expect(calculateCost(0)).toBe(0);
      expect(calculateCost(1)).toBe(1);
      expect(calculateCost(2)).toBe(4);
      expect(calculateCost(3)).toBe(9);
      expect(calculateCost(10)).toBe(100);
    });
  });

  describe("calculateMaxVotes", () => {
    it("クレジットから投票可能な最大票数を計算", () => {
      expect(calculateMaxVotes(0)).toBe(0);
      expect(calculateMaxVotes(1)).toBe(1);
      expect(calculateMaxVotes(4)).toBe(2);
      expect(calculateMaxVotes(9)).toBe(3);
      expect(calculateMaxVotes(100)).toBe(10);
    });

    it("端数は切り捨て", () => {
      expect(calculateMaxVotes(5)).toBe(2); // √5 ≈ 2.24
      expect(calculateMaxVotes(8)).toBe(2); // √8 ≈ 2.83
      expect(calculateMaxVotes(15)).toBe(3); // √15 ≈ 3.87
    });
  });

  describe("calculateTotalCost", () => {
    it("複数の投票の総コストを計算", () => {
      expect(calculateTotalCost([])).toBe(0);
      expect(calculateTotalCost([{ amount: 1 }])).toBe(1);
      expect(calculateTotalCost([{ amount: 2 }, { amount: 3 }])).toBe(13); // 4 + 9
      expect(
        calculateTotalCost([{ amount: 1 }, { amount: 2 }, { amount: 3 }])
      ).toBe(14); // 1 + 4 + 9
    });
  });

  describe("calculateRemainingCredits", () => {
    it("残りクレジットを計算", () => {
      expect(calculateRemainingCredits(100, [])).toBe(100);
      expect(calculateRemainingCredits(100, [{ amount: 5 }])).toBe(75); // 100 - 25
      expect(
        calculateRemainingCredits(100, [{ amount: 3 }, { amount: 4 }])
      ).toBe(75); // 100 - 9 - 16
    });
  });

  describe("calculateMaxAdditionalVotes", () => {
    it("追加可能な最大票数を計算", () => {
      // 残り75クレジット、現在0票 → √75 ≈ 8票まで可能
      expect(calculateMaxAdditionalVotes(0, 75)).toBe(8);

      // 残り75クレジット、現在2票（コスト4） → √(75+4) = √79 ≈ 8票まで可能
      expect(calculateMaxAdditionalVotes(2, 75)).toBe(8);
    });
  });

  describe("canChangeVote", () => {
    it("クレジット内なら投票変更可能", () => {
      // 残り75、0→5票: コスト0→25、差分25 ≤ 75
      expect(canChangeVote(0, 5, 75)).toBe(true);

      // 残り75、0→9票: コスト0→81、差分81 > 75
      expect(canChangeVote(0, 9, 75)).toBe(false);

      // 残り10、5→4票: コスト25→16、差分-9（減少）
      expect(canChangeVote(5, 4, 10)).toBe(true);
    });
  });
});
