"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

type EventData = {
  id: string;
  slug: string | null;
  title: string;
  adminToken: string;
  startDate: Date;
  endDate: Date;
  creditsPerVoter: number;
  votingMode: string;
};

type Props = {
  event: EventData;
};

export function EventCreatedContent({ event }: Props) {
  const t = useTranslations();
  const [adminUrlCopied, setAdminUrlCopied] = useState(false);
  const [eventUrlCopied, setEventUrlCopied] = useState(false);

  // URLの生成
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const eventPath = event.slug
    ? `/events/${event.slug}`
    : `/events/${event.id}`;
  const eventUrl = `${baseUrl}${eventPath}`;
  const adminUrl = `${baseUrl}/admin/${event.id}?token=${event.adminToken}`;

  const copyToClipboard = async (text: string, type: "admin" | "event") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "admin") {
        setAdminUrlCopied(true);
        setTimeout(() => setAdminUrlCopied(false), 2000);
      } else {
        setEventUrlCopied(true);
        setTimeout(() => setEventUrlCopied(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const votingModeLabel =
    {
      individual: t("event.create.authModes.individual.title"),
      google: t("event.create.authModes.google.title"),
      line: t("event.create.authModes.line.title"),
    }[event.votingMode] ?? event.votingMode;

  return (
    <div className="space-y-6">
      {/* 成功メッセージ */}
      <div className="flex items-center justify-center gap-3 py-8">
        <CheckCircle className="size-12 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold">{t("event.created.title")}</h1>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
      </div>

      {/* 警告：管理用URL */}
      <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
            <div>
              <CardTitle className="text-amber-800 dark:text-amber-200">
                {t("event.created.adminUrlLabel")}
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                {t("event.created.adminUrlWarning")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label
              htmlFor="admin-url"
              className="text-amber-800 dark:text-amber-200"
            >
              Admin URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="admin-url"
                value={adminUrl}
                readOnly
                className="bg-white font-mono text-sm dark:bg-black"
              />
              <Button
                onClick={() => copyToClipboard(adminUrl, "admin")}
                variant="outline"
                className="shrink-0"
              >
                {adminUrlCopied ? (
                  <>
                    <Check className="size-4" />
                    {t("common.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    {t("common.copy")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* イベント情報 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.eventInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* イベントURL */}
          <div className="space-y-2">
            <Label htmlFor="event-url">
              {t("event.created.publicUrlLabel")}
            </Label>
            <div className="flex gap-2">
              <Input
                id="event-url"
                value={eventUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(eventUrl, "event")}
                variant="outline"
                className="shrink-0"
              >
                {eventUrlCopied ? (
                  <>
                    <Check className="size-4" />
                    {t("common.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    {t("common.copy")}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">
                {t("event.create.startDateLabel")}
              </p>
              <p className="font-medium">
                {new Date(event.startDate).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t("event.create.endDateLabel")}
              </p>
              <p className="font-medium">
                {new Date(event.endDate).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t("event.create.creditsLabel")}
              </p>
              <p className="font-medium">{event.creditsPerVoter}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t("event.create.authModeLabel")}
              </p>
              <p className="font-medium">{votingModeLabel}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/admin/${event.id}?token=${event.adminToken}`}>
              <ExternalLink className="size-4" />
              {t("event.created.goToAdmin")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{t("common.back")}</Link>
          </Button>
        </CardFooter>
      </Card>

      {/* 次のステップ */}
      <Card>
        <CardHeader>
          <CardTitle>{t("event.created.nextSteps")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-muted-foreground list-inside list-decimal space-y-2">
            <li>{t("event.created.addSubjects")}</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
