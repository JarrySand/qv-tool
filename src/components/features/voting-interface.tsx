"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  calculateCost,
  calculateTotalCost,
  calculateRemainingCredits,
} from "@/lib/utils/qv";
import { submitVote, type SubmitVoteResult } from "@/lib/actions/vote";
import { SquareCostVisualizer } from "./square-cost-visualizer";
import { Loader2, Minus, Plus } from "lucide-react";

interface Subject {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  url: string | null;
}

interface VotingInterfaceProps {
  eventId: string;
  subjects: Subject[];
  totalCredits: number;
  token?: string;
  existingVotes?: { subjectId: string; amount: number }[];
  voteId?: string;
}

export function VotingInterface({
  eventId,
  subjects,
  totalCredits,
  token,
  existingVotes,
  voteId,
}: VotingInterfaceProps) {
  const t = useTranslations("vote");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 各対象への投票数を管理
  const [votes, setVotes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    subjects.forEach((s) => {
      const existing = existingVotes?.find((v) => v.subjectId === s.id);
      initial[s.id] = existing?.amount ?? 0;
    });
    return initial;
  });

  const [error, setError] = useState<string | null>(null);

  // 投票データの配列形式
  const voteArray = useMemo(
    () =>
      Object.entries(votes).map(([subjectId, amount]) => ({
        subjectId,
        amount,
      })),
    [votes]
  );

  // 残りクレジット
  const remainingCredits = useMemo(
    () => calculateRemainingCredits(totalCredits, voteArray),
    [totalCredits, voteArray]
  );

  // 総消費クレジット
  const totalCost = useMemo(() => calculateTotalCost(voteArray), [voteArray]);

  // 投票数の変更
  const handleVoteChange = (subjectId: string, delta: number) => {
    setVotes((prev) => {
      const current = prev[subjectId] ?? 0;
      const newAmount = current + delta;

      if (newAmount < 0) return prev;

      if (delta > 0) {
        const newCost = calculateCost(newAmount);
        const currentCost = calculateCost(current);
        const costIncrease = newCost - currentCost;

        if (costIncrease > remainingCredits) {
          return prev;
        }
      }

      return { ...prev, [subjectId]: newAmount };
    });
  };

  // 投票を送信
  const handleSubmit = () => {
    setError(null);

    startTransition(async () => {
      const details = voteArray.filter((v) => v.amount > 0);

      if (details.length === 0) {
        setError(t("errors.noCredits"));
        return;
      }

      const result: SubmitVoteResult = await submitVote({
        eventId,
        details,
        token,
        existingVoteId: voteId,
      });

      if (result.success) {
        router.push(`/events/${eventId}/complete`);
      } else {
        setError(result.error);
      }
    });
  };

  // リセット
  const handleReset = () => {
    const initial: Record<string, number> = {};
    subjects.forEach((s) => {
      const existing = existingVotes?.find((v) => v.subjectId === s.id);
      initial[s.id] = existing?.amount ?? 0;
    });
    setVotes(initial);
    setError(null);
  };

  const hasAnyVotes = voteArray.some((v) => v.amount > 0);
  const isEditing = !!existingVotes;
  const isLow = remainingCredits < totalCredits * 0.2;

  return (
    <div className="space-y-6">
      {/* クレジット表示 */}
      <Card className="bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-4 z-10 backdrop-blur">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-sm">
                {t("remainingCredits")}
              </div>
              <div className="text-3xl font-bold">
                <span
                  className={isLow ? "text-destructive" : "text-foreground"}
                >
                  {remainingCredits}
                </span>
                <span className="text-muted-foreground ml-1 text-lg">
                  / {totalCredits}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-sm">
                {t("totalCost")}
              </div>
              <div className="text-xl font-semibold">{totalCost}</div>
            </div>
          </div>

          {/* プログレスバー */}
          <div
            className="bg-muted mt-3 h-2 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={totalCost}
            aria-valuemin={0}
            aria-valuemax={totalCredits}
            aria-label={t("creditUsage")}
          >
            <div
              className={`h-full transition-all duration-300 ${isLow ? "bg-destructive" : "bg-secondary"}`}
              style={{ width: `${(totalCost / totalCredits) * 100}%` }}
            />
          </div>

          {/* ヒント */}
          <p className="text-muted-foreground mt-2 text-xs">{t("costHint")}</p>
        </CardContent>
      </Card>

      {/* 投票対象一覧 */}
      <div className="grid gap-4">
        {subjects.map((subject) => {
          const currentVotes = votes[subject.id] ?? 0;
          const cost = calculateCost(currentVotes);
          const nextCost = calculateCost(currentVotes + 1);
          const costIncrease = nextCost - cost;
          const canIncrease = costIncrease <= remainingCredits;

          return (
            <Card key={subject.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* 画像 */}
                  {subject.imageUrl && (
                    <div className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={subject.imageUrl}
                        alt={subject.title}
                        fill
                        className="object-cover"
                        unoptimized={subject.imageUrl.startsWith("data:")}
                      />
                    </div>
                  )}

                  {/* コンテンツ */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold">{subject.title}</h3>
                    {subject.description && (
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                        {subject.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* 投票コントロール */}
                <div className="mt-4 flex items-center gap-4">
                  {/* 正方形コストビジュアライザー（固定幅） */}
                  <div className="shrink-0">
                    <SquareCostVisualizer
                      votes={currentVotes}
                      size="sm"
                      maxDisplayVotes={10}
                      showLabel
                      fixedSize
                    />
                  </div>

                  {/* スペーサー */}
                  <div className="flex-1" />

                  {/* ステッパー（固定位置） */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleVoteChange(subject.id, -1)}
                      disabled={currentVotes === 0 || isPending}
                      className="h-11 w-11 rounded-xl"
                      aria-label={`${subject.title}の投票を減らす`}
                    >
                      <Minus className="size-5" />
                    </Button>

                    <div className="w-12 text-center">
                      <div className="text-2xl font-bold">{currentVotes}</div>
                    </div>

                    <Button
                      type="button"
                      variant={canIncrease ? "secondary" : "outline"}
                      size="icon"
                      onClick={() => handleVoteChange(subject.id, 1)}
                      disabled={!canIncrease || isPending}
                      className="h-11 w-11 rounded-xl"
                      aria-label={`${subject.title}の投票を増やす`}
                    >
                      <Plus className="size-5" />
                    </Button>
                  </div>

                  {/* コスト表示（固定幅） */}
                  <div className="w-16 shrink-0 text-right">
                    <div className="text-secondary text-lg font-bold">
                      {cost}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {canIncrease ? `+1→+${costIncrease}` : t("cost")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* QVの説明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Quadratic Voting</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm leading-relaxed">
            1 {t("votes")} = 1 credit, 2 {t("votes")} = 4 credits, 3{" "}
            {t("votes")} = 9 credits...
          </CardDescription>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border p-4 text-sm"
        >
          {error}
        </div>
      )}

      {/* アクションボタン */}
      <div className="sticky bottom-4 flex flex-col gap-4 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isPending}
          className="sm:flex-1"
        >
          {tCommon("cancel")}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!hasAnyVotes || isPending}
          className="h-14 text-lg sm:flex-1"
        >
          {isPending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              {t("submitting")}
            </>
          ) : isEditing ? (
            t("editVote")
          ) : (
            t("submitVote")
          )}
        </Button>
      </div>
    </div>
  );
}
