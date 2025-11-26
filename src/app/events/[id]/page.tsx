import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type EventStatus = "upcoming" | "active" | "ended";

function getEventStatus(startDate: Date, endDate: Date): EventStatus {
  const now = new Date();
  if (now < startDate) return "upcoming";
  if (now > endDate) return "ended";
  return "active";
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function EventPage({ params, searchParams }: PageProps) {
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
      _count: {
        select: { votes: true },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const status = getEventStatus(event.startDate, event.endDate);
  const session = await auth();

  // 投票可能な場合は直接投票ページにリダイレクト
  if (status === "active") {
    if (event.votingMode === "individual") {
      if (token) {
        // トークンの有効性を確認
        const accessToken = await prisma.accessToken.findFirst({
          where: {
            eventId: event.id,
            token,
          },
        });
        if (accessToken) {
          // 投票ページへ直接リダイレクト
          redirect(`/events/${event.slug ?? event.id}/vote?token=${token}`);
        }
      }
    } else {
      // Google/LINE認証の場合
      if (session?.user) {
        // 投票ページへ直接リダイレクト
        redirect(`/events/${event.slug ?? event.id}/vote`);
      }
    }
  }

  // 投票できない場合のメッセージ
  let authMessage = "";
  if (status === "upcoming") {
    authMessage = t("vote.errors.notActive");
  } else if (status === "ended") {
    authMessage = t("vote.errors.notActive");
  } else if (event.votingMode === "individual" && !token) {
    authMessage = t("vote.errors.authRequired");
  } else if (event.votingMode !== "individual" && !session?.user) {
    authMessage = t("vote.errors.authRequired");
  }

  const statusLabels = {
    upcoming: t("event.status.upcoming"),
    active: t("event.status.active"),
    ended: t("event.status.ended"),
  };

  const statusClasses = {
    upcoming:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    active:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    ended: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusClasses[status]}`}
            >
              {statusLabels[status]}
            </span>
            <span className="text-sm text-muted-foreground">
              {event._count.votes} {t("results.statistics.participants")}
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">{event.title}</h1>
          {event.description && (
            <p className="whitespace-pre-wrap text-lg text-muted-foreground">
              {event.description}
            </p>
          )}
        </div>

        {/* イベント情報カード */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">{t("event.info.period")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">
                  {t("event.create.startDateLabel")}
                </div>
                <div className="font-medium">
                  {event.startDate.toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  {t("event.create.endDateLabel")}
                </div>
                <div className="font-medium">
                  {event.endDate.toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="text-sm text-muted-foreground">
                {t("event.info.credits")}
              </div>
              <div className="text-2xl font-bold text-secondary-foreground">
                {event.creditsPerVoter}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 投票対象一覧 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">{t("event.info.subjects")}</CardTitle>
            <CardDescription>
              {event.subjects.length} {t("event.info.subjects")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {event.subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5"
                >
                  {subject.imageUrl && (
                    <div className="relative shrink-0">
                      <Image
                        src={subject.imageUrl}
                        alt={subject.title}
                        width={80}
                        height={80}
                        className="rounded-md object-cover"
                        unoptimized={subject.imageUrl.startsWith("data:")}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{subject.title}</h3>
                    {subject.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {subject.description}
                      </p>
                    )}
                    {subject.url && (
                      <a
                        href={subject.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm text-primary hover:underline"
                      >
                        {t("common.next")} →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* アクションボタン */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <div className="text-center">
            <p className="mb-4 text-muted-foreground">{authMessage}</p>
            {status === "active" && event.votingMode !== "individual" && (
              <Button asChild variant="outline">
                <Link
                  href={`/auth/signin?callbackUrl=${encodeURIComponent(`/events/${event.slug ?? event.id}`)}`}
                >
                  {t("auth.signIn")}
                </Link>
              </Button>
            )}
          </div>

          {status !== "upcoming" && (
            <Button asChild variant="outline" size="lg">
              <Link href={`/events/${event.slug ?? event.id}/result`}>
                {t("vote.viewResults")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
