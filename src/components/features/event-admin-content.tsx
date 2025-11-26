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
import {
  ArrowLeft,
  Copy,
  Check,
  Plus,
  ExternalLink,
  Settings,
  Users,
  BarChart3,
  AlertCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { SubjectList } from "./subject-list";
import { EventEditDialog } from "./event-edit-dialog";
import { AccessTokenManager } from "./access-token-manager";

type Subject = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  order: number;
};

type AccessToken = {
  id: string;
  token: string;
  isUsed: boolean;
  createdAt: Date;
};

type EventData = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  adminToken: string;
  startDate: Date;
  endDate: Date;
  creditsPerVoter: number;
  votingMode: string;
  subjects: Subject[];
  accessTokens: AccessToken[];
  hasVotes: boolean;
  status: "upcoming" | "active" | "ended";
};

type Props = {
  event: EventData;
  adminToken: string;
};

export function EventAdminContent({ event, adminToken }: Props) {
  const [eventUrlCopied, setEventUrlCopied] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(event);

  // URLの生成
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const eventPath = currentEvent.slug
    ? `/events/${currentEvent.slug}`
    : `/events/${currentEvent.id}`;
  const eventUrl = `${baseUrl}${eventPath}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setEventUrlCopied(true);
      setTimeout(() => setEventUrlCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const votingModeLabel = {
    individual: "個別URL方式",
    google: "Googleアカウント",
    line: "LINEアカウント",
  }[currentEvent.votingMode] ?? currentEvent.votingMode;

  const statusBadge = {
    upcoming: {
      icon: Clock,
      label: "開始前",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
    active: {
      icon: CheckCircle,
      label: "開催中",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    },
    ended: {
      icon: AlertCircle,
      label: "終了",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    },
  }[currentEvent.status];

  const StatusIcon = statusBadge.icon;

  const handleEventUpdate = (updatedData: Partial<EventData>) => {
    setCurrentEvent((prev) => ({ ...prev, ...updatedData }));
    setShowEditDialog(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            トップへ戻る
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{currentEvent.title}</h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.className}`}
            >
              <StatusIcon className="size-3" />
              {statusBadge.label}
            </span>
          </div>
          {currentEvent.description && (
            <p className="mt-2 text-muted-foreground">{currentEvent.description}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowEditDialog(true)}>
          <Settings className="size-4" />
          設定
        </Button>
      </div>

      {/* 投票開始後の警告 */}
      {currentEvent.hasVotes && (
        <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-50 p-4 dark:bg-amber-950/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                投票が開始されています
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                投票対象やクレジット数の変更はできません。タイトルや説明文のみ編集可能です。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* イベント情報 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            イベント情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* イベントURL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">イベントURL</label>
            <div className="flex gap-2">
              <Input value={eventUrl} readOnly className="font-mono text-sm" />
              <Button
                onClick={() => copyToClipboard(eventUrl)}
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
              <Button variant="outline" asChild className="shrink-0">
                <a href={eventPath} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">開始日時</p>
              <p className="font-medium">
                {new Date(currentEvent.startDate).toLocaleString("ja-JP")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">終了日時</p>
              <p className="font-medium">
                {new Date(currentEvent.endDate).toLocaleString("ja-JP")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">クレジット数</p>
              <p className="font-medium">{currentEvent.creditsPerVoter} クレジット/人</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">認証方式</p>
              <p className="font-medium">{votingModeLabel}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href={`/events/${currentEvent.slug ?? currentEvent.id}/result`}>
              <BarChart3 className="size-4" />
              結果を見る
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* 投票対象管理 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              投票対象
            </CardTitle>
            {!currentEvent.hasVotes && (
              <Button size="sm">
                <Plus className="size-4" />
                追加
              </Button>
            )}
          </div>
          <CardDescription>
            {currentEvent.subjects.length > 0
              ? `${currentEvent.subjects.length}件の投票対象が登録されています`
              : "まだ投票対象が登録されていません。追加してください。"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubjectList
            subjects={currentEvent.subjects}
            eventId={currentEvent.id}
            adminToken={adminToken}
            isLocked={currentEvent.hasVotes}
          />
        </CardContent>
      </Card>

      {/* 個別URL方式の場合のトークン管理 */}
      {currentEvent.votingMode === "individual" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              参加者トークン
            </CardTitle>
            <CardDescription>
              個別URL方式の投票者用トークンを管理します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccessTokenManager
              tokens={currentEvent.accessTokens}
              eventId={currentEvent.id}
              adminToken={adminToken}
            />
          </CardContent>
        </Card>
      )}

      {/* 編集ダイアログ */}
      {showEditDialog && (
        <EventEditDialog
          event={currentEvent}
          adminToken={adminToken}
          onClose={() => setShowEditDialog(false)}
          onUpdate={handleEventUpdate}
        />
      )}
    </div>
  );
}

