import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildEventShareUrl, withLineExternalBrowser } from "./share-url";

describe("withLineExternalBrowser", () => {
  it("appends openExternalBrowser=1 to a URL with no query", () => {
    expect(withLineExternalBrowser("https://example.com/events/abc")).toBe(
      "https://example.com/events/abc?openExternalBrowser=1"
    );
  });

  it("appends with & when query already exists", () => {
    expect(
      withLineExternalBrowser("https://example.com/events/abc?token=x")
    ).toBe("https://example.com/events/abc?token=x&openExternalBrowser=1");
  });

  it("does not double-append if already present", () => {
    const url = "https://example.com/x?openExternalBrowser=1";
    expect(withLineExternalBrowser(url)).toBe(url);
  });
});

describe("buildEventShareUrl", () => {
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

  it("with token: returns /events/{id}/vote direct link with openExternalBrowser=1 (no LIFF)", () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "1234567890-abcdefgh";
    const url = buildEventShareUrl("evt1", {
      token: "tok123",
      baseUrl: "https://example.com",
    });
    expect(url).toBe(
      "https://example.com/events/evt1/vote?token=tok123&openExternalBrowser=1"
    );
  });

  it("votingMode=individual: does not use LIFF even if LIFF_ID is set", () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "1234567890-abcdefgh";
    const url = buildEventShareUrl("evt1", {
      baseUrl: "https://example.com",
      votingMode: "individual",
    });
    expect(url).toBe("https://example.com/events/evt1?openExternalBrowser=1");
  });

  it("LIFF_ID set: returns /r/{id} relay URL (not liff.line.me) for OpenChat compatibility", () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "1234567890-abcdefgh";
    const url = buildEventShareUrl("evt1", {
      baseUrl: "https://example.com",
    });
    expect(url).toBe("https://example.com/r/evt1");
    expect(url).not.toContain("liff.line.me");
  });

  it("LIFF_ID unset: returns /events/{id} with openExternalBrowser=1", () => {
    const url = buildEventShareUrl("evt1", {
      baseUrl: "https://example.com",
    });
    expect(url).toBe("https://example.com/events/evt1?openExternalBrowser=1");
  });

  it("works with slug as well", () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "1234567890-abcdefgh";
    const url = buildEventShareUrl("my-event-slug", {
      baseUrl: "https://example.com",
    });
    expect(url).toBe("https://example.com/r/my-event-slug");
  });
});
