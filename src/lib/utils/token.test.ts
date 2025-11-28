import { describe, it, expect } from "vitest";
import {
  generateSecureAdminToken,
  generateSecureAccessToken,
  validateTokenEntropy,
  isValidTokenFormat,
  generateUuidToken,
  generateShortId,
} from "./token";

describe("セキュアトークン生成ユーティリティ", () => {
  describe("generateSecureAdminToken", () => {
    it("256ビット（43文字）のトークンを生成する", () => {
      const token = generateSecureAdminToken();
      expect(token.length).toBe(43);
    });

    it("有効なBase64 URL-safe形式を生成する", () => {
      const token = generateSecureAdminToken();
      expect(isValidTokenFormat(token)).toBe(true);
    });

    it("毎回異なるトークンを生成する", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureAdminToken());
      }
      expect(tokens.size).toBe(100);
    });

    it("十分なエントロピーを持つ", () => {
      const token = generateSecureAdminToken();
      expect(validateTokenEntropy(token, 256)).toBe(true);
    });
  });

  describe("generateSecureAccessToken", () => {
    it("128ビット（22文字）のトークンを生成する", () => {
      const token = generateSecureAccessToken();
      expect(token.length).toBe(22);
    });

    it("有効なBase64 URL-safe形式を生成する", () => {
      const token = generateSecureAccessToken();
      expect(isValidTokenFormat(token)).toBe(true);
    });

    it("毎回異なるトークンを生成する", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureAccessToken());
      }
      expect(tokens.size).toBe(100);
    });

    it("十分なエントロピーを持つ", () => {
      const token = generateSecureAccessToken();
      expect(validateTokenEntropy(token, 128)).toBe(true);
    });
  });

  describe("validateTokenEntropy", () => {
    it("十分なエントロピーを持つトークンはtrueを返す", () => {
      // 128ビット = 22文字のBase64
      expect(validateTokenEntropy("A".repeat(22), 128)).toBe(true);
      expect(validateTokenEntropy("A".repeat(43), 256)).toBe(true);
    });

    it("不十分なエントロピーを持つトークンはfalseを返す", () => {
      expect(validateTokenEntropy("short", 128)).toBe(false);
      expect(validateTokenEntropy("A".repeat(20), 128)).toBe(false);
    });

    it("デフォルトは128ビット", () => {
      expect(validateTokenEntropy("A".repeat(22))).toBe(true);
      expect(validateTokenEntropy("A".repeat(21))).toBe(false);
    });
  });

  describe("isValidTokenFormat", () => {
    it("有効なBase64 URL-safe形式を検証する", () => {
      expect(isValidTokenFormat("abc123")).toBe(true);
      expect(isValidTokenFormat("ABC-xyz_123")).toBe(true);
      expect(isValidTokenFormat("aB3-_")).toBe(true);
    });

    it("無効な文字を含む場合はfalseを返す", () => {
      expect(isValidTokenFormat("abc+123")).toBe(false);
      expect(isValidTokenFormat("abc/123")).toBe(false);
      expect(isValidTokenFormat("abc=")).toBe(false);
      expect(isValidTokenFormat("abc 123")).toBe(false);
      expect(isValidTokenFormat("")).toBe(false);
    });
  });

  describe("generateUuidToken", () => {
    it("有効なUUID v4形式を生成する", () => {
      const uuid = generateUuidToken();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      expect(uuid).toMatch(uuidRegex);
    });

    it("毎回異なるUUIDを生成する", () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUuidToken());
      }
      expect(uuids.size).toBe(100);
    });

    it("36文字の長さを持つ", () => {
      const uuid = generateUuidToken();
      expect(uuid.length).toBe(36);
    });
  });

  describe("generateShortId", () => {
    it("デフォルトで8文字のIDを生成する", () => {
      const id = generateShortId();
      expect(id.length).toBe(8);
    });

    it("指定した長さのIDを生成する", () => {
      expect(generateShortId(4).length).toBe(4);
      expect(generateShortId(12).length).toBe(12);
      expect(generateShortId(16).length).toBe(16);
    });

    it("読み間違えやすい文字を含まない", () => {
      const excludedChars = ["0", "O", "1", "I", "l"];
      for (let i = 0; i < 100; i++) {
        const id = generateShortId(32);
        for (const char of excludedChars) {
          expect(id).not.toContain(char);
        }
      }
    });

    it("毎回異なるIDを生成する", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateShortId());
      }
      expect(ids.size).toBe(100);
    });
  });
});
