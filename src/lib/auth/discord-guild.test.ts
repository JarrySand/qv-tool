import { describe, it, expect, vi, beforeEach } from "vitest";
import { isValidGuildId, isValidRoleId } from "./discord-guild";

// fetchをモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Discord Guild ユーティリティ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isValidGuildId", () => {
    it("17桁の数値を有効として受け入れる", () => {
      expect(isValidGuildId("12345678901234567")).toBe(true);
    });

    it("18桁の数値を有効として受け入れる", () => {
      expect(isValidGuildId("123456789012345678")).toBe(true);
    });

    it("19桁の数値を有効として受け入れる", () => {
      expect(isValidGuildId("1234567890123456789")).toBe(true);
    });

    it("16桁以下の数値を無効として拒否する", () => {
      expect(isValidGuildId("1234567890123456")).toBe(false);
    });

    it("20桁以上の数値を無効として拒否する", () => {
      expect(isValidGuildId("12345678901234567890")).toBe(false);
    });

    it("数字以外の文字を含む場合は無効として拒否する", () => {
      expect(isValidGuildId("12345678901234567a")).toBe(false);
      expect(isValidGuildId("abcdefghijklmnopq")).toBe(false);
      expect(isValidGuildId("123456789-12345678")).toBe(false);
    });

    it("空文字を無効として拒否する", () => {
      expect(isValidGuildId("")).toBe(false);
    });
  });

  describe("isValidRoleId", () => {
    it("17桁の数値を有効として受け入れる", () => {
      expect(isValidRoleId("12345678901234567")).toBe(true);
    });

    it("18桁の数値を有効として受け入れる", () => {
      expect(isValidRoleId("123456789012345678")).toBe(true);
    });

    it("19桁の数値を有効として受け入れる", () => {
      expect(isValidRoleId("1234567890123456789")).toBe(true);
    });

    it("16桁以下の数値を無効として拒否する", () => {
      expect(isValidRoleId("1234567890123456")).toBe(false);
    });

    it("20桁以上の数値を無効として拒否する", () => {
      expect(isValidRoleId("12345678901234567890")).toBe(false);
    });

    it("数字以外の文字を含む場合は無効として拒否する", () => {
      expect(isValidRoleId("12345678901234567a")).toBe(false);
      expect(isValidRoleId("abcdefghijklmnopq")).toBe(false);
      expect(isValidRoleId("123456789-12345678")).toBe(false);
    });

    it("空文字を無効として拒否する", () => {
      expect(isValidRoleId("")).toBe(false);
    });
  });
});
