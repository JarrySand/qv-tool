"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EventStatistics {
  totalParticipants: number;
  totalCreditsUsed: number;
  totalCreditsAvailable: number;
  averageCreditsUsed: number;
  participationRate: number;
}

interface StatisticsCardProps {
  statistics: EventStatistics;
  creditsPerVoter: number;
  votingMode: string;
}

export function StatisticsCard({
  statistics,
  creditsPerVoter,
  votingMode,
}: StatisticsCardProps) {
  const t = useTranslations("results.statistics");
  const utilizationRate =
    statistics.totalCreditsAvailable > 0
      ? (statistics.totalCreditsUsed / statistics.totalCreditsAvailable) * 100
      : 0;

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
      {/* 総参加者数 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            {t("participants")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {statistics.totalParticipants}
          </div>
        </CardContent>
      </Card>

      {/* 総消費クレジット */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            {t("totalCreditsUsed")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {statistics.totalCreditsUsed.toLocaleString()}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            / {statistics.totalCreditsAvailable.toLocaleString()} (
            {utilizationRate.toFixed(1)}%)
          </p>
        </CardContent>
      </Card>

      {/* 平均消費クレジット */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            {t("averageCredits")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {statistics.averageCreditsUsed.toFixed(1)}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            / {creditsPerVoter}
          </p>
        </CardContent>
      </Card>

      {/* 参加率（個別投票の場合） or クレジット消費率 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            {votingMode === "individual"
              ? t("participationRate")
              : t("creditUsageRate")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {votingMode === "individual"
              ? statistics.participationRate.toFixed(1)
              : utilizationRate.toFixed(1)}
            %
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
