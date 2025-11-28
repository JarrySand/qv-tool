import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { VotingInterface } from "@/components/features/voting-interface";
import { getExistingVote } from "@/lib/actions/vote";
import { authenticateVoter } from "@/lib/auth/voting-auth";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/features/sign-out-button";

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
          <p className="text-muted-foreground mb-6">
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
          <p className="text-muted-foreground mb-6">
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

  // 認証チェック（authenticateVoterを使用してDiscordゲート機能をサポート）
  const authResult = await authenticateVoter(event.id, token);

  if (!authResult.authenticated) {
    // 未認証の場合
    if (
      authResult.error === "ログインが必要です" ||
      authResult.error === "Discord認証が必要です"
    ) {
      // 未ログインの場合、サインインページへリダイレクト
      const callbackUrl = `/events/${event.slug ?? event.id}/vote${token ? `?token=${token}` : ""}`;
      redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }

    // 異なるプロバイダーでログインしている場合
    if (authResult.error?.includes("でログインしてください")) {
      const callbackUrl = `/events/${event.slug ?? event.id}/vote${token ? `?token=${token}` : ""}`;
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h1 className="text-destructive mb-4 text-2xl font-bold">
              認証方式が異なります
            </h1>
            <p className="text-muted-foreground mb-6">{authResult.error}</p>
            <p className="text-muted-foreground mb-6 text-sm">
              現在のセッションからログアウトして、正しい認証方式でログインし直してください
            </p>
            <div className="flex flex-col gap-3">
              <SignOutButton
                callbackUrl={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              >
                ログアウトして再ログイン
              </SignOutButton>
              <Button asChild variant="outline">
                <Link href={`/events/${event.slug ?? event.id}`}>
                  イベントページに戻る
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Discordゲートで弾かれた場合
    if (authResult.error === "このサーバーのメンバーのみ投票可能です") {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h1 className="text-destructive mb-4 text-2xl font-bold">
              投票できません
            </h1>
            <p className="text-muted-foreground mb-6">
              {authResult.requiredGuildName
                ? `「${authResult.requiredGuildName}」サーバーのメンバーのみ投票可能です`
                : "指定されたDiscordサーバーのメンバーのみ投票可能です"}
            </p>
            <p className="text-muted-foreground mb-6 text-sm">
              サーバーに参加してから再度お試しください
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

    // その他のエラー
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-destructive mb-4 text-2xl font-bold">
            {authResult.error}
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
    <main
      id="main-content"
      className="from-background to-muted/30 min-h-screen bg-gradient-to-b"
    >
      <div className="container mx-auto max-w-3xl px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href={`/events/${event.slug ?? event.id}${token ? `?token=${token}` : ""}`}
            className="text-muted-foreground hover:text-foreground mb-2 inline-block text-sm"
          >
            ← {t("common.back")}
          </Link>
          <h1 className="text-2xl font-bold md:text-3xl">{event.title}</h1>
          {existingVote && (
            <p className="bg-accent/50 text-muted-foreground mt-2 rounded-lg px-3 py-2 text-sm">
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
