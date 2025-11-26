import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { VotingInterface } from "@/components/features/voting-interface";
import { getExistingVote } from "@/lib/actions/vote";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function VotePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;
  const t = await getTranslations();

  // イベント情報を取得
  const event = await prisma.event.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      subjects: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // 投票期間チェック
  const now = new Date();
  if (now < event.startDate) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">
            {t("vote.errors.notActive")}
          </h1>
          <p className="mb-6 text-muted-foreground">
            {event.startDate.toLocaleDateString()}
          </p>
          <Button asChild variant="outline">
            <Link href={`/events/${event.slug ?? event.id}`}>
              {t("common.back")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (now > event.endDate) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">
            {t("vote.errors.notActive")}
          </h1>
          <p className="mb-6 text-muted-foreground">
            {event.endDate.toLocaleDateString()}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild variant="outline">
              <Link href={`/events/${event.slug ?? event.id}`}>
                {t("common.back")}
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/events/${event.slug ?? event.id}/result`}>
                {t("vote.viewResults")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 認証チェック
  if (event.votingMode === "individual") {
    if (!token) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-2xl font-bold">
              {t("vote.errors.authRequired")}
            </h1>
            <Button asChild variant="outline">
              <Link href={`/events/${event.slug ?? event.id}`}>
                {t("common.back")}
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    // トークンの有効性確認
    const accessToken = await prisma.accessToken.findFirst({
      where: {
        eventId: event.id,
        token,
      },
    });

    if (!accessToken) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-2xl font-bold text-destructive">
              {t("vote.errors.authRequired")}
            </h1>
            <Button asChild variant="outline">
              <Link href={`/events/${event.slug ?? event.id}`}>
                {t("common.back")}
              </Link>
            </Button>
          </div>
        </div>
      );
    }
  } else {
    // Social認証チェック
    const session = await auth();

    if (!session?.user?.id) {
      // 未ログインの場合、サインインページへリダイレクト
      const callbackUrl = `/events/${event.slug ?? event.id}/vote`;
      redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }

  // 投票対象がない場合
  if (event.subjects.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">{t("common.error")}</h1>
          <Button asChild variant="outline">
            <Link href={`/events/${event.slug ?? event.id}`}>
              {t("common.back")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // 既存の投票を取得（再投票用）
  const existingVote = await getExistingVote(event.id, token);

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href={`/events/${event.slug ?? event.id}${token ? `?token=${token}` : ""}`}
            className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t("common.back")}
          </Link>
          <h1 className="text-2xl font-bold md:text-3xl">{event.title}</h1>
          {existingVote && (
            <p className="mt-2 rounded-lg bg-accent/50 px-3 py-2 text-sm text-muted-foreground">
              ✏️ {t("vote.alreadyVoted")}
            </p>
          )}
        </div>

        {/* 投票インターフェース */}
        <VotingInterface
          eventId={event.id}
          subjects={event.subjects}
          totalCredits={event.creditsPerVoter}
          token={token}
          existingVotes={existingVote?.details}
          voteId={existingVote?.voteId}
        />
      </div>
    </main>
  );
}
