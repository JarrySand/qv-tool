"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SubjectResult {
  id: string;
  title: string;
  totalVotes: number;
  totalCost: number;
  voterCount: number;
}

interface ResultsChartProps {
  results: SubjectResult[];
}

// カラーパレット（視覚的に区別しやすい色）
const COLORS = [
  "#EDFF38", // Primary Yellow
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
];

export function ResultsChart({ results }: ResultsChartProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const maxNameChars = isMobile ? 8 : 16;
  const yAxisWidth = isMobile ? 90 : 160;

  // グラフ用データの整形
  const chartData = results.map((result, index) => ({
    name:
      result.title.length > maxNameChars
        ? result.title.slice(0, maxNameChars) + "…"
        : result.title,
    fullName: result.title,
    votes: result.totalVotes,
    cost: result.totalCost,
    color: COLORS[index % COLORS.length],
  }));

  if (chartData.length === 0) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center">
        投票データがありません
      </div>
    );
  }

  // スクリーンリーダー用のサマリー
  const chartSummary = chartData
    .map((d, i) => `${i + 1}位: ${d.fullName} ${d.votes}票`)
    .join("、");

  return (
    <div
      className="h-64 sm:h-80"
      role="img"
      aria-label={`投票結果グラフ: ${chartSummary}`}
    >
      {/* スクリーンリーダー用の詳細データ（視覚的に非表示） */}
      <div className="sr-only">
        <h4>投票結果一覧</h4>
        <ul>
          {chartData.map((d, i) => (
            <li key={d.fullName}>
              {i + 1}位: {d.fullName} - {d.votes}票、消費クレジット: {d.cost}
            </li>
          ))}
        </ul>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
          aria-hidden="true"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
          />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={yAxisWidth}
            interval={0}
            tick={(props) => {
              const { x, y, payload } = props;
              return (
                <text
                  x={x - yAxisWidth + 4}
                  y={y}
                  dy={4}
                  textAnchor="start"
                  fontSize={11}
                  fill="currentColor"
                  className="text-muted-foreground"
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover rounded-lg border p-3 shadow-lg">
                    <p className="font-semibold">{data.fullName}</p>
                    <p className="text-muted-foreground text-sm">
                      得票数:{" "}
                      <span className="font-medium">{data.votes}票</span>
                    </p>
                    <p className="text-muted-foreground text-sm">
                      消費クレジット:{" "}
                      <span className="font-medium">{data.cost}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
