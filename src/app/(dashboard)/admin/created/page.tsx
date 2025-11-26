import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { EventCreatedContent } from "@/components/features/event-created-content";

export const metadata = {
  title: "イベント作成完了 | QV-Tool",
  description: "イベントが正常に作成されました",
};

type PageProps = {
  searchParams: Promise<{ id?: string; token?: string }>;
};

export default async function EventCreatedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { id, token } = params;

  if (!id || !token) {
    notFound();
  }

  // イベント情報を取得（adminTokenが一致するか確認）
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      adminToken: true,
      startDate: true,
      endDate: true,
      creditsPerVoter: true,
      votingMode: true,
    },
  });

  if (!event || event.adminToken !== token) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <EventCreatedContent event={event} />
      </div>
    </main>
  );
}

