"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VotingInterface } from "@/components/features/voting-interface";
import { QvTutorialDialog } from "@/components/features/qv-tutorial-dialog";
import { LinkifyText } from "@/components/ui/linkify-text";
import { calculateCost } from "@/lib/utils/qv";
import type { SubmitVoteResult } from "@/lib/actions/vote";

interface Subject {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  url: string | null;
}

// Mock data - DB不要のサンプルデータ
const MOCK_SUBJECTS: Subject[] = [
  {
    id: "1",
    title: "新しい社内カフェテリアの設置",
    description:
      "オフィス1階に社員向けカフェテリアを新設し、ランチやコーヒーブレイクに利用できるスペースを作る提案です。健康的なメニューを中心に提供予定。",
    imageUrl: null,
    url: null,
  },
  {
    id: "2",
    title:
      "リモートワーク手当の増額についての長いタイトルが折り返されるかテストするための選択肢です",
    description:
      "現在月額5,000円のリモートワーク手当を10,000円に増額する提案。光熱費・通信費の高騰を踏まえ、在宅勤務環境の整備を支援します。これは長い説明文が正しく折り返されるかをテストするための文章でもあります。実際のイベントではもっと簡潔な説明になることが多いですが、長文のケースも対応が必要です。",
    imageUrl: null,
    url: "https://example.com/detail",
  },
  {
    id: "3",
    title: "週4日勤務制度の試験導入",
    description:
      "生産性向上と従業員のウェルビーイングを目的とした週4日勤務の3ヶ月間トライアル。",
    imageUrl: null,
    url: null,
  },
  {
    id: "4",
    title: "社内ハッカソンの定期開催",
    description: null,
    imageUrl: null,
    url: null,
  },
  {
    id: "5",
    title: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    description:
      "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    imageUrl: null,
    url: null,
  },
];

const MOCK_EVENT = {
  title: "2025年度 社内改善提案 投票",
  creditsPerVoter: 100,
  endMessage:
    "投票ありがとうございました！\nこちらからアンケートにご協力ください: https://example.com/survey",
};

export default function VotePreviewPage() {
  const [submittedVotes, setSubmittedVotes] = useState<
    { subjectId: string; amount: number }[] | null
  >(null);

  const handleMockSubmit = useCallback(
    async (
      details: { subjectId: string; amount: number }[]
    ): Promise<SubmitVoteResult> => {
      setSubmittedVotes(details);
      return { success: true, voteId: "preview-mock-id" };
    },
    []
  );

  const handleSuccess = useCallback(() => {
    // onSuccessで遷移を防止 — stateの切り替えだけで完了画面を表示
  }, []);

  // 完了画面（実際の complete/page.tsx と同じレイアウト）
  if (submittedVotes) {
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
            <CardTitle className="text-2xl">投票完了</CardTitle>
            <CardDescription>
              投票が完了しました - {MOCK_EVENT.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 投票結果サマリー */}
            <div className="space-y-2 text-left">
              {submittedVotes.map((v) => {
                const subject = MOCK_SUBJECTS.find((s) => s.id === v.subjectId);
                return (
                  <div
                    key={v.subjectId}
                    className="flex justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {subject?.title}
                    </span>
                    <span className="text-muted-foreground ml-2 shrink-0">
                      {v.amount}票 ({calculateCost(v.amount)}credit)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 終了時メッセージ（endMessage の表示例） */}
            <div className="bg-muted text-muted-foreground rounded-lg p-4 text-left text-sm whitespace-pre-wrap">
              <LinkifyText text={MOCK_EVENT.endMessage} />
            </div>

            <p className="text-muted-foreground text-xs">
              これはプレビューです。実際のDBへの送信は行われていません。
            </p>

            <div className="flex flex-col gap-3">
              <Button asChild>
                <Link href="/preview/result">結果を見る</Link>
              </Button>
              <Button onClick={() => setSubmittedVotes(null)} variant="outline">
                投票を変更する
              </Button>
              <Button asChild variant="ghost">
                <Link href="/preview">プレビュー一覧に戻る</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="from-background to-muted/30 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/preview"
            className="text-muted-foreground hover:text-foreground mb-2 inline-block text-sm"
          >
            ← プレビュー一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold md:text-3xl">{MOCK_EVENT.title}</h1>
          <p className="bg-accent/50 text-muted-foreground mt-2 rounded-lg px-3 py-2 text-sm">
            これはプレビューモードです。DBへの接続は不要です。
          </p>
        </div>

        {/* チュートリアル */}
        <QvTutorialDialog
          totalCredits={MOCK_EVENT.creditsPerVoter}
          alwaysShow
        />

        {/* 本物のVotingInterfaceをモックonSubmit + onSuccessで使用 */}
        <VotingInterface
          eventId="preview"
          subjects={MOCK_SUBJECTS}
          totalCredits={MOCK_EVENT.creditsPerVoter}
          onSubmit={handleMockSubmit}
          onSuccess={handleSuccess}
        />
      </div>
    </main>
  );
}
