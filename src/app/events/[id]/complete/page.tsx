import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function CompletePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;
  const t = await getTranslations();

  // イベント情報を取得
  const event = await prisma.event.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });

  if (!event) {
    notFound();
  }

  const eventUrl = event.slug ?? event.id;

  return (
    <div className="from-background to-muted/30 flex min-h-screen items-center justify-center bg-gradient-to-b p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">{t("vote.complete.title")}</CardTitle>
          <CardDescription>
            {t("vote.complete.message")} - {event.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href={`/events/${eventUrl}/result`}>
                {t("vote.complete.viewResults")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/events/${eventUrl}/vote${token ? `?token=${token}` : ""}`}
              >
                {t("vote.complete.changeVote")}
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link
                href={`/events/${eventUrl}${token ? `?token=${token}` : ""}`}
              >
                {t("common.back")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
