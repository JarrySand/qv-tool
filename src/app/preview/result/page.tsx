"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LiveResultContainer } from "@/components/features/live-result-container";
import type { EventResultData } from "@/lib/actions/result";

// モック結果データ - 投票プレビューと同じ選択肢
const MOCK_RESULT_DATA: EventResultData = {
  event: {
    id: "preview",
    slug: "preview",
    title: "2025年度 社内改善提案 投票",
    description: "社内改善提案についての投票イベントです。",
    startDate: new Date("2025-03-01"),
    endDate: new Date("2025-04-01"),
    creditsPerVoter: 100,
    votingMode: "google",
  },
  results: [
    {
      id: "1",
      title: "新しい社内カフェテリアの設置",
      description:
        "オフィス1階に社員向けカフェテリアを新設し、ランチやコーヒーブレイクに利用できるスペースを作る提案です。",
      imageUrl: null,
      url: null,
      totalVotes: 18,
      totalCost: 142,
      voterCount: 12,
    },
    {
      id: "2",
      title: "リモートワーク手当の増額",
      description:
        "現在月額5,000円のリモートワーク手当を10,000円に増額する提案。",
      imageUrl: null,
      url: null,
      totalVotes: 25,
      totalCost: 215,
      voterCount: 15,
    },
    {
      id: "3",
      title: "週4日勤務制度の試験導入",
      description:
        "生産性向上と従業員のウェルビーイングを目的とした週4日勤務の3ヶ月間トライアル。",
      imageUrl: null,
      url: null,
      totalVotes: 31,
      totalCost: 289,
      voterCount: 18,
    },
    {
      id: "4",
      title: "社内ハッカソンの定期開催",
      description: null,
      imageUrl: null,
      url: null,
      totalVotes: 8,
      totalCost: 36,
      voterCount: 6,
    },
    {
      id: "5",
      title: "オフィス緑化プロジェクト",
      description: "オフィス内に観葉植物やグリーンウォールを導入する提案。",
      imageUrl: null,
      url: null,
      totalVotes: 12,
      totalCost: 68,
      voterCount: 9,
    },
  ],
  statistics: {
    totalParticipants: 25,
    totalCreditsUsed: 750,
    totalCreditsAvailable: 2500,
    averageCreditsUsed: 30.0,
    participationRate: 83.3,
  },
  distributions: [
    {
      subjectId: "1",
      subjectTitle: "新しい社内カフェテリアの設置",
      distribution: [
        { votes: 0, count: 13 },
        { votes: 1, count: 7 },
        { votes: 2, count: 3 },
        { votes: 3, count: 2 },
      ],
    },
    {
      subjectId: "2",
      subjectTitle: "リモートワーク手当の増額",
      distribution: [
        { votes: 0, count: 10 },
        { votes: 1, count: 5 },
        { votes: 2, count: 6 },
        { votes: 3, count: 3 },
        { votes: 4, count: 1 },
      ],
    },
    {
      subjectId: "3",
      subjectTitle: "週4日勤務制度の試験導入",
      distribution: [
        { votes: 0, count: 7 },
        { votes: 1, count: 4 },
        { votes: 2, count: 5 },
        { votes: 3, count: 6 },
        { votes: 4, count: 2 },
        { votes: 5, count: 1 },
      ],
    },
    {
      subjectId: "4",
      subjectTitle: "社内ハッカソンの定期開催",
      distribution: [
        { votes: 0, count: 19 },
        { votes: 1, count: 4 },
        { votes: 2, count: 2 },
      ],
    },
    {
      subjectId: "5",
      subjectTitle: "オフィス緑化プロジェクト",
      distribution: [
        { votes: 0, count: 16 },
        { votes: 1, count: 5 },
        { votes: 2, count: 3 },
        { votes: 3, count: 1 },
      ],
    },
  ],
  hiddenPreferences: {
    singleVoteResults: [
      { subjectId: "3", subjectTitle: "週4日勤務制度の試験導入", votes: 10 },
      { subjectId: "2", subjectTitle: "リモートワーク手当の増額", votes: 7 },
      {
        subjectId: "1",
        subjectTitle: "新しい社内カフェテリアの設置",
        votes: 4,
      },
      { subjectId: "5", subjectTitle: "オフィス緑化プロジェクト", votes: 3 },
      { subjectId: "4", subjectTitle: "社内ハッカソンの定期開催", votes: 1 },
    ],
    hiddenVotes: [
      { subjectId: "2", subjectTitle: "リモートワーク手当の増額", votes: 18 },
      { subjectId: "3", subjectTitle: "週4日勤務制度の試験導入", votes: 21 },
      {
        subjectId: "1",
        subjectTitle: "新しい社内カフェテリアの設置",
        votes: 14,
      },
      { subjectId: "5", subjectTitle: "オフィス緑化プロジェクト", votes: 9 },
      { subjectId: "4", subjectTitle: "社内ハッカソンの定期開催", votes: 7 },
    ],
    totalHiddenVotes: 69,
    totalQvVotes: 94,
  },
};

export default function ResultPreviewPage() {
  return (
    <main className="from-background to-muted/30 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              開催中
            </span>
            <span className="bg-accent/50 text-muted-foreground rounded-full px-3 py-1 text-xs">
              プレビュー
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">
            {MOCK_RESULT_DATA.event.title}
          </h1>
          <p className="text-muted-foreground text-lg">投票結果</p>
          <div className="text-muted-foreground mt-2 text-sm">
            開催期間: 2025/03/01 〜 2025/04/01
          </div>
        </div>

        {/* ライブ結果コンテナ（ポーリングなし） */}
        <LiveResultContainer
          initialData={MOCK_RESULT_DATA}
          eventId="preview"
          isLive={false}
        />

        {/* ナビゲーション */}
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild variant="outline" size="lg">
            <Link href="/preview">プレビュー一覧に戻る</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/preview/vote">投票プレビューへ</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
