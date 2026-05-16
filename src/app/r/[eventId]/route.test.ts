import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

describe("GET /r/[eventId]", () => {
  const originalLiffId = process.env.NEXT_PUBLIC_LIFF_ID;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
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

  it("with LIFF_ID set: 302 redirect to liff.line.me/{liffId}?eventId=...", async () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "1234567890-abcdefgh";
    const res = await callGet("evt1");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://liff.line.me/1234567890-abcdefgh?eventId=evt1"
    );
  });

  it("with LIFF_ID unset: 302 redirect to /events/{id}?openExternalBrowser=1", async () => {
    const res = await callGet("evt1");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://example.com/events/evt1?openExternalBrowser=1"
    );
  });

  it("URL-encodes eventId with special characters", async () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "1234567890-abcdefgh";
    const res = await callGet("a b/c");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://liff.line.me/1234567890-abcdefgh?eventId=a%20b%2Fc"
    );
  });
});
