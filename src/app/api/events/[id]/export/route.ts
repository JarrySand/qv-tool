import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

async function fetchExportData(id: string) {
  const event = await prisma.event.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      subjects: { orderBy: { order: "asc" } },
    },
  });
  if (!event) return null;

  const votes = await prisma.vote.findMany({
    where: { eventId: event.id },
    include: {
      details: {
        include: { subject: { select: { id: true, title: true } } },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          accounts: {
            select: { provider: true, providerAccountId: true },
          },
        },
      },
      accessToken: { select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return { event, votes };
}

const getCachedExportData = async (id: string) => {
  const cached = await unstable_cache(
    () => fetchExportData(id),
    ["event-export", id],
    { tags: [`event-export-${id}`] }
  )();

  if (!cached) return null;

  // unstable_cache は JSON シリアライズを挟むため Date が文字列化される。
  // 呼び出し側の Date メソッド利用に備えて復元する。
  return {
    event: {
      ...cached.event,
      startDate: new Date(cached.event.startDate),
      endDate: new Date(cached.event.endDate),
      createdAt: new Date(cached.event.createdAt),
      updatedAt: new Date(cached.event.updatedAt),
    },
    votes: cached.votes.map((vote) => ({
      ...vote,
      createdAt: new Date(vote.createdAt),
      updatedAt: new Date(vote.updatedAt),
    })),
  };
};

/**
 * GET /api/events/[id]/export?adminToken=xxx
 *
 * 投票結果と投票者情報をJSON形式でエクスポートする管理者向けAPI
 * adminTokenによる認証が必要
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminToken = request.nextUrl.searchParams.get("adminToken");

  if (!adminToken) {
    return NextResponse.json(
      { error: "adminToken is required" },
      { status: 401 }
    );
  }

  const cached = await getCachedExportData(id);
  if (!cached) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  const { event, votes } = cached;

  if (event.adminToken !== adminToken) {
    return NextResponse.json({ error: "Invalid adminToken" }, { status: 403 });
  }

  // レスポンス構築
  const exportData = {
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      votingMode: event.votingMode,
      creditsPerVoter: event.creditsPerVoter,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
    },
    subjects: event.subjects.map(
      (s: { id: string; title: string; description: string | null }) => ({
        id: s.id,
        title: s.title,
        description: s.description,
      })
    ),
    votes: votes.map((vote: (typeof votes)[number]) => {
      // 投票者情報の構築
      let voter: Record<string, unknown>;

      if (vote.user) {
        // Social Auth (Google/Discord/LINE)
        const account = vote.user.accounts[0];
        voter = {
          userId: vote.user.id,
          name: vote.user.name,
          email: vote.user.email,
          image: vote.user.image,
          provider: account?.provider ?? null,
          providerAccountId: account?.providerAccountId ?? null,
        };
      } else if (vote.accessToken) {
        // Individual token: トークン本体は漏洩リスクがあるので返さない
        voter = {
          type: "token",
          accessTokenId: vote.accessToken.id,
        };
      } else {
        voter = { type: "unknown" };
      }

      return {
        voteId: vote.id,
        votedAt: vote.createdAt.toISOString(),
        updatedAt: vote.updatedAt.toISOString(),
        voter,
        details: vote.details.map((d: (typeof vote.details)[number]) => ({
          subjectId: d.subject.id,
          subjectTitle: d.subject.title,
          amount: d.amount,
          cost: d.cost,
        })),
        totalCost: vote.details.reduce(
          (sum: number, d: (typeof vote.details)[number]) => sum + d.cost,
          0
        ),
      };
    }),
    totalParticipants: votes.length,
    exportedAt: new Date().toISOString(),
  };

  return NextResponse.json(exportData);
}
