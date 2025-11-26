import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getEventResults } from "@/lib/actions/result";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LiveResultContainer } from "@/components/features/live-result-container";
import { CsvExportButtons } from "@/components/features/csv-export-buttons";

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

export default async function ResultPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token: adminToken } = await searchParams;
  const t = await getTranslations();

  const result = await getEventResults(id);

  if (!result) {
    notFound();
  }

  const { event } = result;
  const status = getEventStatus(event.startDate, event.endDate);
  const isLive = status === "active";

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
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusClasses[status]}`}
            >
              {statusLabels[status]}
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">{event.title}</h1>
          <p className="text-lg text-muted-foreground">{t("results.title")}</p>
          <div className="mt-2 text-sm text-muted-foreground">
            {t("event.info.period")}: {event.startDate.toLocaleDateString()} 〜{" "}
            {event.endDate.toLocaleDateString()}
          </div>
        </div>

        {/* ライブ結果コンテナ */}
        <LiveResultContainer
          initialData={result}
          eventId={event.id}
          isLive={isLive}
        />

        {/* CSVエクスポート（管理者のみ） */}
        {adminToken && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">{t("common.download")}</CardTitle>
              <CardDescription>CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <CsvExportButtons
                eventId={event.id}
                eventSlug={event.slug}
                adminToken={adminToken}
              />
            </CardContent>
          </Card>
        )}

        {/* ナビゲーション */}
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild variant="outline" size="lg">
            <Link href={`/events/${event.slug ?? event.id}`}>
              {t("common.back")}
            </Link>
          </Button>
          {status === "active" && (
            <Button asChild size="lg">
              <Link href={`/events/${event.slug ?? event.id}/vote`}>
                {t("vote.submitVote")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
