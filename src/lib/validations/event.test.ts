import { describe, it, expect } from "vitest";
import { createEventSchema, updateEventSchema } from "./event";

describe("イベントバリデーション", () => {
  describe("createEventSchema", () => {
    const validInput = {
      title: "テストイベント",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-31"),
      creditsPerVoter: 100,
      votingMode: "individual" as const,
    };

    it("有効な入力を受け入れる", () => {
      const result = createEventSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("説明とslugはオプショナル", () => {
      const result = createEventSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("説明付きの入力を受け入れる", () => {
      const result = createEventSchema.safeParse({
        ...validInput,
        description: "イベントの説明です",
      });
      expect(result.success).toBe(true);
    });

    it("slug付きの入力を受け入れる", () => {
      const result = createEventSchema.safeParse({
        ...validInput,
        slug: "my-event-2025",
      });
      expect(result.success).toBe(true);
    });

    describe("タイトルのバリデーション", () => {
      it("空のタイトルを拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          title: "",
        });
        expect(result.success).toBe(false);
      });

      it("100文字を超えるタイトルを拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          title: "a".repeat(101),
        });
        expect(result.success).toBe(false);
      });

      it("100文字のタイトルを受け入れる", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          title: "a".repeat(100),
        });
        expect(result.success).toBe(true);
      });
    });

    describe("slugのバリデーション", () => {
      it("有効なslugを受け入れる", () => {
        const validSlugs = ["my-event", "test123", "event-2025-01"];
        for (const slug of validSlugs) {
          const result = createEventSchema.safeParse({
            ...validInput,
            slug,
          });
          expect(result.success).toBe(true);
        }
      });

      it("大文字を含むslugを拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          slug: "MyEvent",
        });
        expect(result.success).toBe(false);
      });

      it("スペースを含むslugを拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          slug: "my event",
        });
        expect(result.success).toBe(false);
      });

      it("2文字以下のslugを拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          slug: "ab",
        });
        expect(result.success).toBe(false);
      });

      it("50文字を超えるslugを拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          slug: "a".repeat(51),
        });
        expect(result.success).toBe(false);
      });
    });

    describe("クレジット数のバリデーション", () => {
      it("1未満のクレジット数を拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          creditsPerVoter: 0,
        });
        expect(result.success).toBe(false);
      });

      it("1000を超えるクレジット数を拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          creditsPerVoter: 1001,
        });
        expect(result.success).toBe(false);
      });

      it("1〜1000のクレジット数を受け入れる", () => {
        for (const creditsPerVoter of [1, 50, 100, 500, 1000]) {
          const result = createEventSchema.safeParse({
            ...validInput,
            creditsPerVoter,
          });
          expect(result.success).toBe(true);
        }
      });
    });

    describe("認証方式のバリデーション", () => {
      it("有効な認証方式を受け入れる", () => {
        for (const votingMode of [
          "individual",
          "google",
          "line",
          "discord",
        ] as const) {
          const result = createEventSchema.safeParse({
            ...validInput,
            votingMode,
          });
          expect(result.success).toBe(true);
        }
      });

      it("無効な認証方式を拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          votingMode: "invalid",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("DiscordサーバーIDのバリデーション", () => {
      it("有効なDiscordサーバーIDを受け入れる", () => {
        const validGuildIds = [
          "12345678901234567", // 17桁
          "123456789012345678", // 18桁
          "1234567890123456789", // 19桁
        ];
        for (const discordGuildId of validGuildIds) {
          const result = createEventSchema.safeParse({
            ...validInput,
            votingMode: "discord",
            discordGuildId,
          });
          expect(result.success).toBe(true);
        }
      });

      it("短すぎるDiscordサーバーIDを拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          votingMode: "discord",
          discordGuildId: "1234567890123456", // 16桁
        });
        expect(result.success).toBe(false);
      });

      it("長すぎるDiscordサーバーIDを拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          votingMode: "discord",
          discordGuildId: "12345678901234567890", // 20桁
        });
        expect(result.success).toBe(false);
      });

      it("数字以外を含むDiscordサーバーIDを拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          votingMode: "discord",
          discordGuildId: "12345678901234567a",
        });
        expect(result.success).toBe(false);
      });

      it("空文字はundefinedに変換される", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          votingMode: "discord",
          discordGuildId: "",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.discordGuildId).toBeUndefined();
        }
      });
    });

    describe("DiscordロールIDのバリデーション", () => {
      it("有効なDiscordロールIDを受け入れる", () => {
        const validRoleIds = [
          "12345678901234567", // 17桁
          "123456789012345678", // 18桁
          "1234567890123456789", // 19桁
        ];
        for (const discordRequiredRoleId of validRoleIds) {
          const result = createEventSchema.safeParse({
            ...validInput,
            votingMode: "discord",
            discordGuildId: "123456789012345678",
            discordRequiredRoleId,
          });
          expect(result.success).toBe(true);
        }
      });

      it("短すぎるDiscordロールIDを拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          votingMode: "discord",
          discordGuildId: "123456789012345678",
          discordRequiredRoleId: "1234567890123456", // 16桁
        });
        expect(result.success).toBe(false);
      });

      it("長すぎるDiscordロールIDを拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          votingMode: "discord",
          discordGuildId: "123456789012345678",
          discordRequiredRoleId: "12345678901234567890", // 20桁
        });
        expect(result.success).toBe(false);
      });

      it("数字以外を含むDiscordロールIDを拒否する", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          votingMode: "discord",
          discordGuildId: "123456789012345678",
          discordRequiredRoleId: "12345678901234567a",
        });
        expect(result.success).toBe(false);
      });

      it("空文字はundefinedに変換される", () => {
        const result = createEventSchema.safeParse({
          ...validInput,
          votingMode: "discord",
          discordGuildId: "123456789012345678",
          discordRequiredRoleId: "",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.discordRequiredRoleId).toBeUndefined();
        }
      });
    });
  });

  describe("updateEventSchema", () => {
    it("空のオブジェクトを受け入れる（すべてオプショナル）", () => {
      const result = updateEventSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("タイトルのみの更新を受け入れる", () => {
      const result = updateEventSchema.safeParse({
        title: "新しいタイトル",
      });
      expect(result.success).toBe(true);
    });

    it("説明のみの更新を受け入れる", () => {
      const result = updateEventSchema.safeParse({
        description: "新しい説明",
      });
      expect(result.success).toBe(true);
    });

    it("複数フィールドの更新を受け入れる", () => {
      const result = updateEventSchema.safeParse({
        title: "新しいタイトル",
        description: "新しい説明",
        startDate: new Date("2025-02-01"),
      });
      expect(result.success).toBe(true);
    });
  });
});
