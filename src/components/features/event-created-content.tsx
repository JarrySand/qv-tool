"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [adminUrlCopied, setAdminUrlCopied] = useState(false);
  const [eventUrlCopied, setEventUrlCopied] = useState(false);

  // URLの生成
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const eventPath = event.slug ? `/events/${event.slug}` : `/events/${event.id}`;
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

  const votingModeLabel = {
    individual: "個別URL方式",
    google: "Googleアカウント",
    line: "LINEアカウント",
  }[event.votingMode] ?? event.votingMode;

  return (
    <div className="space-y-6">
      {/* 成功メッセージ */}
      <div className="flex items-center justify-center gap-3 py-8">
        <CheckCircle className="size-12 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold">イベントを作成しました！</h1>
          <p className="text-muted-foreground">
            「{event.title}」の準備が整いました
          </p>
        </div>
      </div>

      {/* 警告：管理用URL */}
      <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-5 text-amber-600 mt-0.5" />
            <div>
              <CardTitle className="text-amber-800 dark:text-amber-200">
                重要：管理用URLを必ず保存してください
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                このページを閉じると、管理用URLは再表示できません。
                安全な場所に保存してください。
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="admin-url" className="text-amber-800 dark:text-amber-200">
              管理用URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="admin-url"
                value={adminUrl}
                readOnly
                className="bg-white dark:bg-black font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(adminUrl, "admin")}
                variant="outline"
                className="shrink-0"
              >
                {adminUrlCopied ? (
                  <>
                    <Check className="size-4" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    コピー
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
          <CardTitle>イベント情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* イベントURL */}
          <div className="space-y-2">
            <Label htmlFor="event-url">イベントURL（参加者向け）</Label>
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
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    コピー
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">開始日時</p>
              <p className="font-medium">
                {new Date(event.startDate).toLocaleString("ja-JP")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">終了日時</p>
              <p className="font-medium">
                {new Date(event.endDate).toLocaleString("ja-JP")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">クレジット数</p>
              <p className="font-medium">{event.creditsPerVoter} クレジット/人</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">認証方式</p>
              <p className="font-medium">{votingModeLabel}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3 flex-wrap">
          <Button asChild>
            <Link href={`/admin/${event.id}?token=${event.adminToken}`}>
              <ExternalLink className="size-4" />
              管理画面を開く
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              トップへ戻る
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* 次のステップ */}
      <Card>
        <CardHeader>
          <CardTitle>次のステップ</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>管理画面で投票対象（選択肢）を追加してください</li>
            {event.votingMode === "individual" && (
              <li>参加者用の個別URLを生成し、配布してください</li>
            )}
            <li>イベントURLを参加者に共有してください</li>
            <li>投票期間が終了したら、結果を確認してください</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

