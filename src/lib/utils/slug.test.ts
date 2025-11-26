import { describe, it, expect } from "vitest";
import { generateSlug, sanitizeSlug, generateAdminToken } from "./slug";

describe("slugユーティリティ", () => {
  describe("generateSlug", () => {
    it("8文字のhex文字列を生成する", () => {
      const slug = generateSlug();
      expect(slug).toHaveLength(8);
      expect(slug).toMatch(/^[a-f0-9]+$/);
    });

    it("毎回異なるslugを生成する", () => {
      const slugs = new Set();
      for (let i = 0; i < 100; i++) {
        slugs.add(generateSlug());
      }
      expect(slugs.size).toBe(100);
    });
  });

  describe("sanitizeSlug", () => {
    it("大文字を小文字に変換する", () => {
      expect(sanitizeSlug("MyEvent")).toBe("myevent");
      expect(sanitizeSlug("ABC")).toBe("abc");
    });

    it("無効な文字をハイフンに変換する", () => {
      expect(sanitizeSlug("my_event")).toBe("my-event");
      expect(sanitizeSlug("my event")).toBe("my-event");
      expect(sanitizeSlug("my@event!")).toBe("my-event");
    });

    it("連続するハイフンを1つにまとめる", () => {
      expect(sanitizeSlug("my---event")).toBe("my-event");
      expect(sanitizeSlug("my--event")).toBe("my-event");
    });

    it("先頭と末尾のハイフンを削除する", () => {
      expect(sanitizeSlug("-myevent-")).toBe("myevent");
      expect(sanitizeSlug("---myevent---")).toBe("myevent");
    });

    it("有効なslugはそのまま返す", () => {
      expect(sanitizeSlug("my-event-2024")).toBe("my-event-2024");
      expect(sanitizeSlug("test123")).toBe("test123");
    });

    it("空文字列を処理する", () => {
      expect(sanitizeSlug("")).toBe("");
      expect(sanitizeSlug("---")).toBe("");
    });
  });

  describe("generateAdminToken", () => {
    it("UUID v4形式のトークンを生成する", () => {
      const token = generateAdminToken();
      // UUID v4形式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
      expect(token).toMatch(uuidRegex);
    });

    it("毎回異なるトークンを生成する", () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateAdminToken());
      }
      expect(tokens.size).toBe(100);
    });

    it("36文字のトークンを生成する", () => {
      const token = generateAdminToken();
      expect(token).toHaveLength(36);
    });
  });
});

