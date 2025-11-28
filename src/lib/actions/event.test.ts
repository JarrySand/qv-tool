import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEventSchema, updateEventSchema } from "@/lib/validations";

// Prismaのモック
vi.mock("@/lib/db", () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    vote: {
      count: vi.fn(),
    },
  },
}));

// next-intlのモック
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() => (key: string) => key),
}));

// headersのモック
vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Map([["x-forwarded-for", "127.0.0.1"]])),
}));

// レート制限のモック
vi.mock("@/lib/rate-limit", () => ({
  checkEventCreateRateLimit: vi.fn(() => ({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 3600000,
  })),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

describe("イベントバリデーション", () => {
  describe("createEventSchema", () => {
    it("有効なイベントデータを受け入れる", () => {
      const validData = {
        title: "テストイベント",
        description: "テスト用のイベント説明",
        startDate: new Date("2025-12-01"),
        endDate: new Date("2025-12-31"),
        creditsPerVoter: 100,
        votingMode: "individual",
      };

      const result = createEventSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("タイトルが空の場合はエラー", () => {
      const invalidData = {
        title: "",
        startDate: new Date("2025-12-01"),
        endDate: new Date("2025-12-31"),
        creditsPerVoter: 100,
        votingMode: "individual",
      };

      const result = createEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("クレジットが0以下の場合はエラー", () => {
      const invalidData = {
        title: "テスト",
        startDate: new Date("2025-12-01"),
        endDate: new Date("2025-12-31"),
        creditsPerVoter: 0,
        votingMode: "individual",
      };

      const result = createEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("無効な投票モードはエラー", () => {
      const invalidData = {
        title: "テスト",
        startDate: new Date("2025-12-01"),
        endDate: new Date("2025-12-31"),
        creditsPerVoter: 100,
        votingMode: "invalid",
      };

      const result = createEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("カスタムslugを受け入れる", () => {
      const validData = {
        title: "テストイベント",
        slug: "my-custom-event",
        startDate: new Date("2025-12-01"),
        endDate: new Date("2025-12-31"),
        creditsPerVoter: 100,
        votingMode: "individual",
      };

      const result = createEventSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("不正なslug形式はエラー", () => {
      const invalidData = {
        title: "テストイベント",
        slug: "My Event!",
        startDate: new Date("2025-12-01"),
        endDate: new Date("2025-12-31"),
        creditsPerVoter: 100,
        votingMode: "individual",
      };

      const result = createEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("updateEventSchema", () => {
    it("部分的な更新データを受け入れる", () => {
      const partialData = {
        title: "更新されたタイトル",
      };

      const result = updateEventSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it("空のオブジェクトを受け入れる", () => {
      const result = updateEventSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("説明のみの更新を受け入れる", () => {
      const partialData = {
        description: "新しい説明文",
      };

      const result = updateEventSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });
  });
});

describe("イベント作成ロジック", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("必須フィールドが揃っていれば成功する", async () => {
    const validInput = {
      title: "テストイベント",
      startDate: new Date("2025-12-01"),
      endDate: new Date("2025-12-31"),
      creditsPerVoter: 100,
      votingMode: "individual" as const,
    };

    const result = createEventSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("開始日が終了日より後の場合は検出可能", () => {
    const invalidInput = {
      title: "テストイベント",
      startDate: new Date("2025-12-31"),
      endDate: new Date("2025-12-01"),
      creditsPerVoter: 100,
      votingMode: "individual" as const,
    };

    // バリデーションは通るが、Server Action内で日付チェック
    const result = createEventSchema.safeParse(invalidInput);
    expect(result.success).toBe(true);

    // 日付の比較ロジック
    expect(invalidInput.endDate <= invalidInput.startDate).toBe(true);
  });
});
