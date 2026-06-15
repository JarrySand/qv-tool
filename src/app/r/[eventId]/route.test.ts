import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET } from "./route";
import { prisma } from "@/lib/db";

// Prisma のモック (/r ルートは voting 方式を見て LIFF を使うか判定する)
vi.mock("@/lib/db", () => ({
  prisma: {
    event: {
      findFirst: vi.fn(),
    },
  },
}));

const mockFindFirst = vi.mocked(prisma.event.findFirst);

describe("GET /r/[eventId]", () => {
  const originalLiffId = process.env.NEXT_PUBLIC_LIFF_ID;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    mockFindFirst.mockReset();
  });

  afterEach(() => {
    if (originalLiffId === undefined) {
      delete process.env.NEXT_PUBLIC_LIFF_ID;
    } else {
      process.env.NEXT_PUBLIC_LIFF_ID = originalLiffId;
    }
  });

  const callGet = (eventId: string) => {
    const request = new Request(
      `https://example.com/r/${encodeURIComponent(eventId)}`
    );
    return GET(request, { params: Promise.resolve({ eventId }) });
  };

  it("LINE event + LIFF_ID set: 302 redirect to liff.line.me/{liffId}?eventId=...", async () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "1234567890-abcdefgh";
    // @ts-expect-error partial mock return is fine for this test
    mockFindFirst.mockResolvedValue({ votingMode: "line" });
    const res = await callGet("evt1");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://liff.line.me/1234567890-abcdefgh?eventId=evt1"
    );
  });

  it("Discord event + LIFF_ID set: does NOT use LIFF, redirects to /events/{id}", async () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "1234567890-abcdefgh";
    // @ts-expect-error partial mock return is fine for this test
    mockFindFirst.mockResolvedValue({ votingMode: "discord" });
    const res = await callGet("evt1");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://example.com/events/evt1?openExternalBrowser=1"
    );
    expect(res.headers.get("location")).not.toContain("liff.line.me");
  });

  it("Google event + LIFF_ID set: does NOT use LIFF, redirects to /events/{id}", async () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "1234567890-abcdefgh";
    // @ts-expect-error partial mock return is fine for this test
    mockFindFirst.mockResolvedValue({ votingMode: "google" });
    const res = await callGet("evt1");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://example.com/events/evt1?openExternalBrowser=1"
    );
  });

  it("event not found + LIFF_ID set: does NOT use LIFF, redirects to /events/{id}", async () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "1234567890-abcdefgh";
    mockFindFirst.mockResolvedValue(null);
    const res = await callGet("evt1");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://example.com/events/evt1?openExternalBrowser=1"
    );
  });

  it("with LIFF_ID unset: 302 redirect to /events/{id}?openExternalBrowser=1 (no DB lookup)", async () => {
    const res = await callGet("evt1");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://example.com/events/evt1?openExternalBrowser=1"
    );
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("URL-encodes eventId with special characters (LINE event)", async () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "1234567890-abcdefgh";
    // @ts-expect-error partial mock return is fine for this test
    mockFindFirst.mockResolvedValue({ votingMode: "line" });
    const res = await callGet("a b/c");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://liff.line.me/1234567890-abcdefgh?eventId=a%20b%2Fc"
    );
  });
});
