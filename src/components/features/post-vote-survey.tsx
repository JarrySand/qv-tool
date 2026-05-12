"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { submitSurvey } from "@/lib/actions/survey";

const Q1_OPTIONS = [
  "login",
  "credit_allocation",
  "ui",
  "confirm_method",
  "none",
  "other",
] as const;

interface PostVoteSurveyProps {
  eventId: string;
  voteId?: string;
  /** 個別投票方式の場合の所有権確認用トークン */
  token?: string;
}

export function PostVoteSurvey({
  eventId,
  voteId,
  token,
}: PostVoteSurveyProps) {
  const t = useTranslations("vote.survey");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Q1
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    []
  );
  const [q1Other, setQ1Other] = useState("");

  // Q2, Q3
  const [q2Score, setQ2Score] = useState<number | null>(null);
  const [q3Score, setQ3Score] = useState<number | null>(null);

  // Q4
  const [q4Feedback, setQ4Feedback] = useState("");

  const toggleDifficulty = (option: string) => {
    setSelectedDifficulties((prev) => {
      if (option === "none") {
        return prev.includes("none") ? [] : ["none"];
      }
      const without = prev.filter((d) => d !== "none");
      return without.includes(option)
        ? without.filter((d) => d !== option)
        : [...without, option];
    });
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitSurvey({
        eventId,
        voteId,
        token,
        q1Difficulties:
          selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
        q1Other: selectedDifficulties.includes("other") ? q1Other : undefined,
        q2CreditSatisfaction: q2Score ?? undefined,
        q3QvPreference: q3Score ?? undefined,
        q4Feedback: q4Feedback || undefined,
      });
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }
    });
  };

  if (submitted) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <svg
              className="h-5 w-5"
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
            <p className="text-sm font-medium">{t("submitted")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription className="text-xs">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Q1: 困った点（複数選択） */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("q1Label")}</p>
          <div className="flex flex-wrap gap-2">
            {Q1_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleDifficulty(option)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  selectedDifficulties.includes(option)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {t(`q1Options.${option}`)}
              </button>
            ))}
          </div>
          {selectedDifficulties.includes("other") && (
            <Textarea
              value={q1Other}
              onChange={(e) => setQ1Other(e.target.value)}
              placeholder={t("q1OtherPlaceholder")}
              className="mt-2 text-sm"
              rows={2}
            />
          )}
        </div>

        {/* Q2: クレジット配分の満足度 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("q2Label")}</p>
          <ScaleSelector value={q2Score} onChange={setQ2Score} t={t} />
        </div>

        {/* Q3: QV vs 一人一票 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("q3Label")}</p>
          <ScaleSelector value={q3Score} onChange={setQ3Score} t={t} />
        </div>

        {/* Q4: 自由記述 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("q4Label")}</p>
          <Textarea
            value={q4Feedback}
            onChange={(e) => setQ4Feedback(e.target.value)}
            placeholder={t("q4Placeholder")}
            className="text-sm"
            rows={3}
          />
        </div>

        {error && <p className="text-destructive text-xs">{t("error")}</p>}

        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full"
          size="sm"
        >
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </CardContent>
    </Card>
  );
}

function ScaleSelector({
  value,
  onChange,
  t,
}: {
  value: number | null;
  onChange: (v: number) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-10 flex-1 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
              value === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="text-muted-foreground flex justify-between px-1 text-[10px]">
        <span>{t("scaleLabels.1")}</span>
        <span>{t("scaleLabels.5")}</span>
      </div>
    </div>
  );
}
