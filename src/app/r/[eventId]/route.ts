import { NextResponse } from "next/server";

/**
 * GET /r/[eventId]
 *
 * LINE オープンチャットは liff.line.me ドメインのリンク送信をブロックするため、
 * 自ドメインを経由した中継リダイレクトを用意する。
 *
 * - LIFF_ID が設定されている場合: liff.line.me/{liffId}?eventId=... へ 302
 *   (LINE 内ブラウザで開かれた場合、LINE がこの遷移を傍受して LIFF ブラウザを起動する)
 * - LIFF_ID 未設定: /events/{id}?openExternalBrowser=1 へ 302 (LIFF を使わない通常導線)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const encoded = encodeURIComponent(eventId);

  const target = liffId
    ? `https://liff.line.me/${liffId}?eventId=${encoded}`
    : new URL(
        `/events/${encoded}?openExternalBrowser=1`,
        request.url
      ).toString();

  return NextResponse.redirect(target, 302);
}
