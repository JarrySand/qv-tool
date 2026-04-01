"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

type SurveyResponse = {
  id: string;
  q1Difficulties: string | null;
  q1Other: string | null;
  q2CreditSatisfaction: number | null;
  q3QvPreference: number | null;
  q4Feedback: string | null;
  createdAt: Date;
};

type Props = {
  responses: SurveyResponse[];
};

const Q1_LABELS: Record<string, string> = {
  login: "ログイン/アカウント作成",
  credit_allocation: "クレジット配分の操作",
  ui: "画面の見やすさ",
  confirm_method: "投票の確定方法",
  none: "特になし",
  other: "その他",
};

const SCALE_LABELS: Record<number, string> = {
  1: "全くそう思わない",
  2: "あまりそう思わない",
  3: "どちらとも言えない",
  4: "そう思う",
  5: "とてもそう思う",
};

function calcAverage(values: number[]): string {
  if (values.length === 0) return "-";
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
}

function ScoreDistribution({
  label,
  values,
}: {
  label: string;
  values: number[];
}) {
  const counts = [0, 0, 0, 0, 0];
  for (const v of values) {
    if (v >= 1 && v <= 5) counts[v - 1]++;
  }
  const max = Math.max(...counts, 1);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-sm">
          平均:{" "}
          <span className="text-foreground font-semibold">
            {calcAverage(values)}
          </span>
          <span className="ml-1 text-xs">/ 5</span>
          <span className="ml-2 text-xs">（{values.length}件）</span>
        </p>
      </div>
      <div className="space-y-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground w-28 shrink-0 text-right">
              {SCALE_LABELS[n]}
            </span>
            <span className="w-4 text-right font-medium">{n}</span>
            <div className="bg-muted h-4 flex-1 overflow-hidden rounded">
              <div
                className="bg-primary h-full rounded transition-all"
                style={{ width: `${(counts[n - 1] / max) * 100}%` }}
              />
            </div>
            <span className="text-muted-foreground w-6 text-right">
              {counts[n - 1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SurveyResultsSection({ responses }: Props) {
  if (responses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            アンケート結果
          </CardTitle>
          <CardDescription>まだ回答がありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Q1 集計
  const q1Counts: Record<string, number> = {};
  const q1OtherTexts: string[] = [];
  for (const r of responses) {
    if (r.q1Difficulties) {
      for (const d of r.q1Difficulties.split(",")) {
        q1Counts[d] = (q1Counts[d] || 0) + 1;
      }
    }
    if (r.q1Other) {
      q1OtherTexts.push(r.q1Other);
    }
  }
  const q1Sorted = Object.entries(q1Counts).sort((a, b) => b[1] - a[1]);
  const q1Max = Math.max(...Object.values(q1Counts), 1);

  // Q2, Q3 集計
  const q2Values = responses
    .map((r) => r.q2CreditSatisfaction)
    .filter((v): v is number => v !== null);
  const q3Values = responses
    .map((r) => r.q3QvPreference)
    .filter((v): v is number => v !== null);

  // Q4 集計
  const q4Texts = responses
    .map((r) => r.q4Feedback)
    .filter((v): v is string => !!v);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="size-5" />
          アンケート結果
        </CardTitle>
        <CardDescription>{responses.length}件の回答</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Q1: 困った点 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Q1. 投票ツールで困った点はありますか？
          </p>
          <div className="space-y-1">
            {q1Sorted.map(([key, count]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-32 shrink-0 text-right">
                  {Q1_LABELS[key] ?? key}
                </span>
                <div className="bg-muted h-4 flex-1 overflow-hidden rounded">
                  <div
                    className="bg-primary h-full rounded transition-all"
                    style={{ width: `${(count / q1Max) * 100}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-6 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
          {q1OtherTexts.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-muted-foreground text-xs font-medium">
                「その他」の回答:
              </p>
              {q1OtherTexts.map((text, i) => (
                <p
                  key={i}
                  className="bg-muted rounded px-3 py-1.5 text-xs whitespace-pre-wrap"
                >
                  {text}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Q2: クレジット配分の満足度 */}
        <ScoreDistribution
          label="Q2. クレジットの配分は、応援したい気持ちを反映できましたか？"
          values={q2Values}
        />

        {/* Q3: QV vs 一人一票 */}
        <ScoreDistribution
          label="Q3. 一人一票と比べて、QVの方が意思を表現しやすいと感じましたか？"
          values={q3Values}
        />

        {/* Q4: 自由記述 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Q4. 改善してほしい点
            <span className="text-muted-foreground ml-1 text-xs font-normal">
              （{q4Texts.length}件）
            </span>
          </p>
          {q4Texts.length > 0 ? (
            <div className="space-y-1.5">
              {q4Texts.map((text, i) => (
                <p
                  key={i}
                  className="bg-muted rounded px-3 py-2 text-sm whitespace-pre-wrap"
                >
                  {text}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">回答なし</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
