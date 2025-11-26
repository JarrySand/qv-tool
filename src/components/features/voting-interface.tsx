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
  calculateMaxAdditionalVotes,
} from "@/lib/utils/qv";
import { submitVote, type SubmitVoteResult } from "@/lib/actions/vote";

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
  // 既存の投票データ（再投票時）
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

      // 最小値チェック
      if (newAmount < 0) return prev;

      // 残りクレジットのチェック（増加の場合）
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

  // 投票済みかどうか
  const hasAnyVotes = voteArray.some((v) => v.amount > 0);
  const isEditing = !!existingVotes;

  return (
    <div className="space-y-6">
      {/* クレジット表示 */}
      <Card className="sticky top-4 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">
                {t("remainingCredits")}
              </div>
              <div className="text-3xl font-bold">
                <span
                  className={
                    remainingCredits < totalCredits * 0.2
                      ? "text-destructive"
                      : "text-foreground"
                  }
                >
                  {remainingCredits}
                </span>
                <span className="ml-1 text-lg text-muted-foreground">
                  / {totalCredits}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {t("totalCost")}
              </div>
              <div className="text-xl font-semibold">{totalCost}</div>
            </div>
          </div>

          {/* プログレスバー */}
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={totalCost}
            aria-valuemin={0}
            aria-valuemax={totalCredits}
            aria-label={t("creditUsage")}
          >
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(totalCost / totalCredits) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 投票対象一覧 */}
      <div className="grid gap-4">
        {subjects.map((subject) => {
          const currentVotes = votes[subject.id] ?? 0;
          const cost = calculateCost(currentVotes);
          const maxVotes = calculateMaxAdditionalVotes(
            currentVotes,
            remainingCredits
          );

          return (
            <Card key={subject.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* 画像 */}
                  {subject.imageUrl && (
                    <div className="relative shrink-0 sm:w-32">
                      <Image
                        src={subject.imageUrl}
                        alt={subject.title}
                        width={128}
                        height={128}
                        className="h-32 w-full object-cover sm:h-full"
                        unoptimized={subject.imageUrl.startsWith("data:")}
                      />
                    </div>
                  )}

                  {/* コンテンツ */}
                  <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold">{subject.title}</h3>
                      {subject.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {subject.description}
                        </p>
                      )}
                      {subject.url && (
                        <a
                          href={subject.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-sm text-primary hover:underline"
                        >
                          {tCommon("next")} →
                        </a>
                      )}
                    </div>

                    {/* 投票コントロール */}
                    <div className="flex items-center gap-4 sm:ml-auto">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleVoteChange(subject.id, -1)}
                          disabled={currentVotes === 0 || isPending}
                          aria-label={`Decrease votes for ${subject.title}`}
                        >
                          <span className="text-xl">−</span>
                        </Button>

                        <div className="w-16 text-center">
                          <div className="text-2xl font-bold">
                            {currentVotes}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("votes")}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleVoteChange(subject.id, 1)}
                          disabled={currentVotes >= maxVotes || isPending}
                          aria-label={`Increase votes for ${subject.title}`}
                        >
                          <span className="text-xl">+</span>
                        </Button>
                      </div>

                      {/* コスト表示 */}
                      <div className="w-20 text-right">
                        <div className="text-lg font-semibold">{cost}</div>
                        <div className="text-xs text-muted-foreground">
                          {t("cost")}
                        </div>
                      </div>
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
          <CardTitle className="text-base">
            📊 Quadratic Voting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm leading-relaxed">
            1 {t("votes")} = 1 credit, 2 {t("votes")} = 4 credits, 3 {t("votes")} = 9 credits...
          </CardDescription>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
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
          className="py-6 text-lg sm:flex-1"
        >
          {isPending
            ? t("submitting")
            : isEditing
              ? t("editVote")
              : t("submitVote")}
        </Button>
      </div>
    </div>
  );
}
