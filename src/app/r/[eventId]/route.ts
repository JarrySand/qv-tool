import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /r/[eventId]
 *
 * LINE オープンチャットは liff.line.me ドメインのリンク送信をブロックするため、
 * 自ドメインを経由した中継リダイレクトを用意する。
 *
 * LIFF は LINE 専用の仕組みなので、liff.line.me 経由 (= /liff ページ) に送るのは
 * LINE 認証イベントのときだけ。Google/Discord/個別投票方式のイベントを LIFF に
 * 流すと /liff ページが無条件に LINE ログインを開始してしまう。それ以外は
 * イベントページへ直接リダイレクトする。
 *
 * - LIFF_ID 設定済み & votingMode === "line": liff.line.me/{liffId}?eventId=... へ 302
 *   (LINE 内ブラウザで開かれた場合、LINE がこの遷移を傍受して LIFF ブラウザを起動する)
 * - それ以外 (LIFF_ID 未設定 / Google / Discord / 個別 / イベント不明):
 *   /events/{id}?openExternalBrowser=1 へ 302 (LIFF を使わない通常導線)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const encoded = encodeURIComponent(eventId);

  let useLiff = false;
  if (liffId) {
    // eventId は id または slug。LINE 認証イベントのみ LIFF を経由させる。
    const event = await prisma.event.findFirst({
      where: { OR: [{ id: eventId }, { slug: eventId }] },
      select: { votingMode: true },
    });
    useLiff = event?.votingMode === "line";
  }

  const target = useLiff
    ? `https://liff.line.me/${liffId}?eventId=${encoded}`
    : new URL(
        `/events/${encoded}?openExternalBrowser=1`,
        request.url
      ).toString();

  return NextResponse.redirect(target, 302);
}
