"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";

interface VoteDistribution {
  subjectId: string;
  subjectTitle: string;
  distribution: { votes: number; count: number }[];
}

interface VoteDistributionChartProps {
  distributions: VoteDistribution[];
}

export function VoteDistributionChart({
  distributions,
}: VoteDistributionChartProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (distributions.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        投票データがありません
      </div>
    );
  }

  const selectedDistribution = distributions[selectedIndex];

  // 0票を含めた分布データを作成
  const maxVotes = Math.max(
    ...selectedDistribution.distribution.map((d) => d.votes),
    0
  );
  const distributionMap = new Map(
    selectedDistribution.distribution.map((d) => [d.votes, d.count])
  );

  const chartData = [];
  for (let i = 0; i <= maxVotes; i++) {
    chartData.push({
      votes: `${i}票`,
      count: distributionMap.get(i) ?? 0,
    });
  }

  // 全員0票の場合
  if (chartData.length === 0 || (chartData.length === 1 && chartData[0].votes === "0票")) {
    chartData.push({ votes: "0票", count: distributionMap.get(0) ?? 0 });
  }

  // スクリーンリーダー用のサマリー
  const distributionSummary = chartData
    .filter((d) => d.count > 0)
    .map((d) => `${d.votes}: ${d.count}人`)
    .join("、");

  return (
    <div className="space-y-4">
      {/* タブ切り替え */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="投票対象の選択">
        {distributions.map((dist, index) => (
          <Button
            key={dist.subjectId}
            variant={selectedIndex === index ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedIndex(index)}
            role="tab"
            aria-selected={selectedIndex === index}
            aria-controls={`distribution-panel-${index}`}
          >
            {dist.subjectTitle.length > 12
              ? dist.subjectTitle.slice(0, 12) + "..."
              : dist.subjectTitle}
          </Button>
        ))}
      </div>

      {/* グラフ */}
      <div
        id={`distribution-panel-${selectedIndex}`}
        role="tabpanel"
        aria-label={`「${selectedDistribution.subjectTitle}」への投票分布グラフ: ${distributionSummary || "データなし"}`}
        className="h-64"
      >
        {/* スクリーンリーダー用の詳細データ */}
        <div className="sr-only">
          <h4>「{selectedDistribution.subjectTitle}」への投票分布</h4>
          <ul>
            {chartData.map((d) => (
              <li key={d.votes}>
                {d.votes}: {d.count}人
              </li>
            ))}
          </ul>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            aria-hidden="true"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="votes" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{data.votes}</p>
                      <p className="text-sm text-muted-foreground">
                        人数: <span className="font-medium">{data.count}人</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 選択中の項目情報 */}
      <div className="text-center text-sm text-muted-foreground" aria-hidden="true">
        「{selectedDistribution.subjectTitle}」への投票分布
      </div>
    </div>
  );
}

