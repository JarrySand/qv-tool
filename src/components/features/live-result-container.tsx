"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { getEventResults, type EventResultData } from "@/lib/actions/result";
import { ResultsChart } from "./results-chart";
import { StatisticsCard } from "./statistics-card";
import { VoteDistributionChart } from "./vote-distribution-chart";
import { VotingComparisonChart } from "./voting-comparison-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LiveResultContainerProps {
  initialData: EventResultData;
  eventId: string;
  isLive: boolean; // 開催中かどうか
}

const POLLING_INTERVAL = 10000; // 10秒

export function LiveResultContainer({
  initialData,
  eventId,
  isLive,
}: LiveResultContainerProps) {
  const t = useTranslations("results");
  const tCommon = useTranslations("common");
  const [data, setData] = useState(initialData);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      setLastUpdated(new Date());
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const newData = await getEventResults(eventId);
      if (newData) {
        setData(newData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [eventId]);

  // 自動更新（開催中のみ）
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(refreshData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [isLive, refreshData]);

  const { results, statistics, distributions, hiddenPreferences } = data;
  const sortedResults = [...results].sort(
    (a, b) => b.totalVotes - a.totalVotes
  );
  const maxVotes = Math.max(...results.map((r) => r.totalVotes), 0);

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* 更新情報バー */}
      <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          {isLive && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              {t("liveUpdating")}
            </span>
          )}
          {lastUpdated && (
            <span className="hidden sm:inline">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshData}
          disabled={isRefreshing}
          className="gap-2"
        >
          <svg
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline">
            {isRefreshing ? tCommon("loading") : "↻"}
          </span>
        </Button>
      </div>

      {/* 統計情報 */}
      <StatisticsCard
        statistics={statistics}
        creditsPerVoter={data.event.creditsPerVoter}
        votingMode={data.event.votingMode}
      />

      {/* 一人一票 vs 二次投票 比較 */}
      <VotingComparisonChart
        qvResults={results.map((r) => ({
          id: r.id,
          title: r.title,
          totalVotes: r.totalVotes,
        }))}
        hiddenPreferences={hiddenPreferences}
        totalParticipants={statistics.totalParticipants}
      />

      {/* メイングラフ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("title")}</CardTitle>
          <CardDescription>{t("votes")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResultsChart results={sortedResults} />
        </CardContent>
      </Card>

      {/* 投票分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("distribution.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <VoteDistributionChart distributions={distributions} />
        </CardContent>
      </Card>
    </div>
  );
}
