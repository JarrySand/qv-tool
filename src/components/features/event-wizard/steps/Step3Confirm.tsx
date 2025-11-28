"use client";

/**
 * Step 3: 確認画面
 * @module event-wizard/steps/Step3Confirm
 */

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useEventWizard } from "../EventWizardContext";
import type { VotingModeLabels } from "../types";

/**
 * 確認画面ステップコンポーネント
 * 入力内容の最終確認を表示
 */
export function Step3Confirm() {
  const t = useTranslations("event.create");
  const { formData, subjects, generalError } = useEventWizard();

  const votingModeLabels: VotingModeLabels = {
    individual: t("authModes.individual.title"),
    google: t("authModes.google.title"),
    line: t("authModes.line.title"),
    discord: t("authModes.discord.title"),
  };

  return (
    <div className="space-y-6">
      {generalError && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
          {generalError}
        </div>
      )}

      {/* 警告 */}
      <div className="rounded-lg border border-amber-500/50 bg-amber-50 p-4 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 size-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {t("wizard.confirmWarning")}
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              {t("wizard.confirmWarningDetail")}
            </p>
          </div>
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("wizard.step1")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">{t("titleLabel")}</p>
              <p className="font-medium">{formData.title}</p>
            </div>
            {formData.description && (
              <div>
                <p className="text-muted-foreground text-sm">
                  {t("descriptionLabel")}
                </p>
                <p>{formData.description}</p>
              </div>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">
                {t("startDateLabel")}
              </p>
              <p>{new Date(formData.startDate).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t("endDateLabel")}
              </p>
              <p>{new Date(formData.endDate).toLocaleString()}</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">
                {t("creditsLabel")}
              </p>
              <p>{formData.creditsPerVoter}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t("authModeLabel")}
              </p>
              <p>{votingModeLabels[formData.votingMode]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 投票候補 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("wizard.step2")}（{subjects.length}件）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {subjects.map((subject, index) => (
              <div key={index} className="rounded border p-3">
                <p className="font-medium">{subject.title}</p>
                {subject.description && (
                  <p className="text-muted-foreground text-sm">
                    {subject.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
