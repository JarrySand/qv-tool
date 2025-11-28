"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HiddenPreferencesData } from "@/lib/actions/result";
import { cn } from "@/lib/utils";

interface VotingComparisonChartProps {
  qvResults: { id: string; title: string; totalVotes: number }[];
  hiddenPreferences: HiddenPreferencesData;
  totalParticipants: number;
}

export function VotingComparisonChart({
  qvResults,
  hiddenPreferences,
  totalParticipants,
}: VotingComparisonChartProps) {
  if (totalParticipants === 0) {
    return null;
  }

  const { singleVoteResults, hiddenVotes, totalHiddenVotes, totalQvVotes } =
    hiddenPreferences;

  // QV結果をソート
  const sortedQvResults = [...qvResults].sort(
    (a, b) => b.totalVotes - a.totalVotes
  );

  // 最大得票数（バーの幅計算用）
  const maxVotes = Math.max(
    ...singleVoteResults.map((r) => r.votes),
    ...sortedQvResults.map((r) => r.totalVotes)
  );

  // 1位の選好だけでは見えなかった投票の割合
  const hiddenPercentage =
    totalQvVotes > 0 ? (totalHiddenVotes / totalQvVotes) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          📊 もし一人一票だったら？
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          一人一票では「1位」しか投票できませんが、二次投票では2位以下の選好も反映されます
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {/* 比較チャート */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 一人一票 */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-muted-foreground font-semibold">
                一人一票の場合
              </h3>
              <span className="text-muted-foreground text-sm">
                総票数: {totalParticipants}
              </span>
            </div>
            <div className="space-y-3">
              {singleVoteResults.map((result, index) => (
                <div key={result.subjectId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span
                      className={cn("truncate", index === 0 && "font-semibold")}
                    >
                      {index === 0 && "👑 "}
                      {result.subjectTitle}
                    </span>
                    <span className="ml-2 shrink-0 font-medium">
                      {result.votes}票
                    </span>
                  </div>
                  <div className="bg-muted h-3 overflow-hidden rounded-full">
                    <div
                      className="bg-muted-foreground/40 h-full transition-all duration-500"
                      style={{
                        width: `${maxVotes > 0 ? (result.votes / maxVotes) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 二次投票（QV） */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-secondary font-semibold">二次投票の結果</h3>
              <span className="text-muted-foreground text-sm">
                総票数: {totalQvVotes}
              </span>
            </div>
            <div className="space-y-3">
              {sortedQvResults.map((result, index) => (
                <div key={result.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span
                      className={cn("truncate", index === 0 && "font-semibold")}
                    >
                      {index === 0 && "👑 "}
                      {result.title}
                    </span>
                    <span className="ml-2 shrink-0 font-medium">
                      {result.totalVotes}票
                    </span>
                  </div>
                  <div className="bg-muted h-3 overflow-hidden rounded-full">
                    <div
                      className="bg-secondary h-full transition-all duration-500"
                      style={{
                        width: `${maxVotes > 0 ? (result.totalVotes / maxVotes) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 埋もれた選好 */}
        {totalHiddenVotes > 0 && (
          <div className="from-secondary/10 to-accent/10 mt-6 rounded-xl bg-gradient-to-r p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  一人一票では埋もれていた選好
                </p>
                <p className="text-secondary text-2xl font-black">
                  {totalHiddenVotes}票 / {totalQvVotes}票
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-sm">
                  埋もれていた割合
                </p>
                <p className="text-secondary text-lg font-bold">
                  {hiddenPercentage.toFixed(1)}%
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mt-3 text-sm">
              💡 一人一票では「2位以下」への投票は結果に反映されません。
              二次投票ではこの {hiddenPercentage.toFixed(1)}%
              の選好も反映されています。
            </p>
          </div>
        )}

        {/* 選択肢ごとの2位以下の票（埋もれた選好が多い順） */}
        {hiddenVotes.length > 0 && (
          <div className="mt-6">
            <h4 className="text-muted-foreground mb-3 text-sm font-semibold">
              「2位以下」として投じられた票
            </h4>
            <div className="space-y-2">
              {hiddenVotes.slice(0, 5).map((subject) => {
                const qvResult = qvResults.find(
                  (r) => r.id === subject.subjectId
                );
                const singleResult = singleVoteResults.find(
                  (r) => r.subjectId === subject.subjectId
                );
                return (
                  <div
                    key={subject.subjectId}
                    className="bg-muted/50 flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="truncate">{subject.subjectTitle}</span>
                    <span className="ml-2 shrink-0">
                      <span className="text-muted-foreground">
                        1位: {singleResult?.votes ?? 0}票
                      </span>
                      <span className="text-muted-foreground mx-1">+</span>
                      <span className="text-secondary font-semibold">
                        2位以下: {subject.votes}票
                      </span>
                      <span className="text-muted-foreground ml-1 text-xs">
                        = {qvResult?.totalVotes ?? 0}票
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
