/**
 * 負荷テスト用 API エンドポイント。
 *
 * 本番の submitVote Server Action を HTTP 経由で呼び出すための薄いラッパー。
 * PoC 前の負荷テスト (100人同時投票) で使う想定。
 *
 * ## セキュリティ
 * - 環境変数 LOAD_TEST_ENABLED=true で明示的に有効化されたときのみ動作
 * - リクエストごとに event.adminToken による認証が必要
 * - 個別投票方式 (votingMode: "individual") のイベントに対してのみ動作する
 *   想定（token フィールドを必須化）
 *
 * ## 使い方
 * ```
 * POST /api/test/submit-vote
 * Body: {
 *   adminToken: string,      // event.adminToken と一致必須
 *   eventSlugOrId: string,
 *   token: string,           // 個別投票用 accessToken
 *   details: { subjectId: string; amount: number }[],
 * }
 * ```
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { submitVote } from "@/lib/actions/vote";

export async function POST(request: NextRequest) {
  if (process.env.LOAD_TEST_ENABLED !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { adminToken, eventSlugOrId, token, details } = body as {
    adminToken?: unknown;
    eventSlugOrId?: unknown;
    token?: unknown;
    details?: unknown;
  };

  if (
    typeof adminToken !== "string" ||
    typeof eventSlugOrId !== "string" ||
    typeof token !== "string" ||
    !Array.isArray(details)
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const event = await prisma.event.findFirst({
    where: { OR: [{ id: eventSlugOrId }, { slug: eventSlugOrId }] },
    select: { id: true, adminToken: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (event.adminToken !== adminToken) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await submitVote({
    eventId: event.id,
    token,
    details: details as { subjectId: string; amount: number }[],
  });

  return NextResponse.json(result);
}
