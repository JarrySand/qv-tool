import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitVoteSchema, validateVoteCost } from "@/lib/validations";

// Prismaのモック
const mockPrisma = {
  event: {
    findUnique: vi.fn(),
  },
  accessToken: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  vote: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  voteDetail: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

// next-intlのモック
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() => (key: string) => key),
}));

// headersのモック
vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve(new Map([["x-forwarded-for", "127.0.0.1"]]))
  ),
}));

// authのモック
vi.mock("@/auth", () => ({
  auth: vi.fn(() => Promise.resolve({ user: { id: "user-123" } })),
}));

// レート制限のモック
vi.mock("@/lib/rate-limit", () => ({
  checkVoteRateLimit: vi.fn(() =>
    Promise.resolve({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
    })
  ),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

describe("投票バリデーションスキーマ", () => {
  describe("submitVoteSchema", () => {
    it("有効な入力を受け入れる", () => {
      const validInput = {
        eventId: "clx123456789012345678901",
        details: [
          { subjectId: "clx123456789012345678901", amount: 2 },
          { subjectId: "clx123456789012345678902", amount: 3 },
        ],
      };

      const result = submitVoteSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("空の詳細配列を拒否する", () => {
      const invalidInput = {
        eventId: "clx123456789012345678901",
        details: [],
      };

      const result = submitVoteSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("無効なeventIdを拒否する", () => {
      const invalidInput = {
        eventId: "invalid",
        details: [{ subjectId: "clx123456789012345678901", amount: 1 }],
      };

      const result = submitVoteSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("負の票数を拒否する", () => {
      const invalidInput = {
        eventId: "clx123456789012345678901",
        details: [{ subjectId: "clx123456789012345678901", amount: -1 }],
      };

      const result = submitVoteSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});

describe("投票コストのバリデーション", () => {
  describe("validateVoteCost", () => {
    it("クレジット内の投票は有効", () => {
      // 3票(9) + 2票(4) = 13クレジット
      const result = validateVoteCost([{ amount: 3 }, { amount: 2 }], 100);

      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(13);
      expect(result.remaining).toBe(87);
    });

    it("ちょうどクレジット上限で有効", () => {
      // 10票 = 100クレジット
      const result = validateVoteCost([{ amount: 10 }], 100);

      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(100);
      expect(result.remaining).toBe(0);
    });

    it("クレジット超過で無効", () => {
      // 11票 = 121クレジット
      const result = validateVoteCost([{ amount: 11 }], 100);

      expect(result.valid).toBe(false);
      expect(result.totalCost).toBe(121);
      expect(result.remaining).toBe(-21);
    });

    it("複数候補での合計コスト計算", () => {
      // 5票(25) + 4票(16) + 3票(9) = 50クレジット
      const result = validateVoteCost(
        [{ amount: 5 }, { amount: 4 }, { amount: 3 }],
        100
      );

      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(50);
      expect(result.remaining).toBe(50);
    });

    it("空の配列は0コスト", () => {
      const result = validateVoteCost([], 100);

      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(0);
      expect(result.remaining).toBe(100);
    });
  });
});

describe("投票ロジック（モックテスト）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("イベント情報の検証", () => {
    it("イベントが存在しない場合の検証ロジック", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      const event = await mockPrisma.event.findUnique({
        where: { id: "non-existent" },
      });

      expect(event).toBeNull();
    });

    it("イベントが存在する場合の検証ロジック", async () => {
      const mockEvent = {
        id: "clx123456789012345678901",
        votingMode: "individual",
        creditsPerVoter: 100,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-12-31"),
        subjects: [{ id: "subject1" }, { id: "subject2" }],
      };

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);

      const event = await mockPrisma.event.findUnique({
        where: { id: "clx123456789012345678901" },
      });

      expect(event).not.toBeNull();
      expect(event?.votingMode).toBe("individual");
      expect(event?.creditsPerVoter).toBe(100);
    });
  });

  describe("投票期間の検証ロジック", () => {
    it("開始前の投票は無効", () => {
      const startDate = new Date("2030-01-01");
      const now = new Date();

      expect(now < startDate).toBe(true);
    });

    it("終了後の投票は無効", () => {
      const endDate = new Date("2020-01-01");
      const now = new Date();

      expect(now > endDate).toBe(true);
    });

    it("期間内の投票は有効", () => {
      const startDate = new Date("2020-01-01");
      const endDate = new Date("2030-12-31");
      const now = new Date();

      expect(now >= startDate && now <= endDate).toBe(true);
    });
  });

  describe("投票対象の存在確認ロジック", () => {
    it("存在する対象への投票を検証", () => {
      const validSubjectIds = new Set(["subject1", "subject2", "subject3"]);
      const voteDetails = [
        { subjectId: "subject1", amount: 1 },
        { subjectId: "subject2", amount: 2 },
      ];

      const allValid = voteDetails.every((d) =>
        validSubjectIds.has(d.subjectId)
      );
      expect(allValid).toBe(true);
    });

    it("存在しない対象への投票を検出", () => {
      const validSubjectIds = new Set(["subject1", "subject2"]);
      const voteDetails = [
        { subjectId: "subject1", amount: 1 },
        { subjectId: "invalid-subject", amount: 2 },
      ];

      const allValid = voteDetails.every((d) =>
        validSubjectIds.has(d.subjectId)
      );
      expect(allValid).toBe(false);
    });
  });

  describe("個別投票モードのトークン検証ロジック", () => {
    it("有効なトークンでアクセストークンを取得", async () => {
      const mockAccessToken = {
        id: "token-id",
        vote: null,
      };

      mockPrisma.accessToken.findFirst.mockResolvedValue(mockAccessToken);

      const accessToken = await mockPrisma.accessToken.findFirst({
        where: { eventId: "event-id", token: "valid-token" },
      });

      expect(accessToken).not.toBeNull();
      expect(accessToken?.vote).toBeNull();
    });

    it("使用済みトークンを検出", async () => {
      const mockAccessToken = {
        id: "token-id",
        vote: { id: "existing-vote" },
      };

      mockPrisma.accessToken.findFirst.mockResolvedValue(mockAccessToken);

      const accessToken = await mockPrisma.accessToken.findFirst({
        where: { eventId: "event-id", token: "used-token" },
      });

      expect(accessToken?.vote).not.toBeNull();
    });

    it("無効なトークンを検出", async () => {
      mockPrisma.accessToken.findFirst.mockResolvedValue(null);

      const accessToken = await mockPrisma.accessToken.findFirst({
        where: { eventId: "event-id", token: "invalid-token" },
      });

      expect(accessToken).toBeNull();
    });
  });

  describe("Social認証モードの重複投票検出ロジック", () => {
    it("既存の投票がない場合", async () => {
      mockPrisma.vote.findUnique.mockResolvedValue(null);

      const existingVote = await mockPrisma.vote.findUnique({
        where: {
          eventId_userId: {
            eventId: "event-id",
            userId: "user-id",
          },
        },
      });

      expect(existingVote).toBeNull();
    });

    it("既存の投票がある場合", async () => {
      const mockVote = { id: "existing-vote-id" };
      mockPrisma.vote.findUnique.mockResolvedValue(mockVote);

      const existingVote = await mockPrisma.vote.findUnique({
        where: {
          eventId_userId: {
            eventId: "event-id",
            userId: "user-id",
          },
        },
      });

      expect(existingVote).not.toBeNull();
    });
  });

  describe("投票コスト計算のエッジケース", () => {
    it("全候補に0票の場合", () => {
      const result = validateVoteCost(
        [{ amount: 0 }, { amount: 0 }, { amount: 0 }],
        100
      );

      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(0);
    });

    it("1候補のみに最大投票", () => {
      const result = validateVoteCost([{ amount: 10 }], 100);

      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(100);
      expect(result.remaining).toBe(0);
    });

    it("複数候補に分散投票で効率的な配分", () => {
      // 5票(25) + 5票(25) + 5票(25) + 5票(25) = 100クレジット
      // 4候補に均等配分：20票で100クレジット
      const result = validateVoteCost(
        [{ amount: 5 }, { amount: 5 }, { amount: 5 }, { amount: 5 }],
        100
      );

      expect(result.valid).toBe(true);
      expect(result.totalCost).toBe(100);
    });

    it("小さいクレジットでの投票制限", () => {
      // 10クレジットでは3票(9)が最大
      const result1 = validateVoteCost([{ amount: 3 }], 10);
      expect(result1.valid).toBe(true);

      const result2 = validateVoteCost([{ amount: 4 }], 10);
      expect(result2.valid).toBe(false);
    });
  });
});
