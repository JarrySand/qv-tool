import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { EventAdminContent } from "@/components/features/event-admin-content";

export const metadata = {
  title: "イベント管理 | QV-Tool",
  description: "イベントの管理・編集を行います",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function EventAdminPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, { token }] = await Promise.all([params, searchParams]);

  if (!token) {
    notFound();
  }

  // イベント情報を取得（adminTokenが一致するか確認）
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      subjects: {
        orderBy: { order: "asc" },
      },
      votes: {
        select: { id: true },
      },
      accessTokens: {
        select: { id: true, token: true, isUsed: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event || event.adminToken !== token) {
    notFound();
  }

  // 投票開始済みかどうか
  const hasVotes = event.votes.length > 0;

  // イベントステータスを計算
  const now = new Date();
  let status: "upcoming" | "active" | "ended";
  if (now < event.startDate) {
    status = "upcoming";
  } else if (now > event.endDate) {
    status = "ended";
  } else {
    status = "active";
  }

  return (
    <main className="min-h-screen bg-background">
      <EventAdminContent
        event={{
          ...event,
          hasVotes,
          status,
        }}
        adminToken={token}
      />
    </main>
  );
}

