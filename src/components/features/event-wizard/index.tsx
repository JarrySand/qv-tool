"use client";

/**
 * イベントウィザードフォーム
 *
 * ステップ形式でイベントを作成するウィザードコンポーネント。
 * 4つのステップで構成:
 * 1. 基本情報入力
 * 2. 投票候補の追加
 * 3. 確認
 * 4. 完了
 *
 * @module event-wizard
 *
 * @example
 * ```tsx
 * import { EventWizardForm } from "@/components/features/event-wizard";
 *
 * export default function CreatePage() {
 *   return <EventWizardForm />;
 * }
 * ```
 */

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, ChevronRight, ChevronLeft, Lock } from "lucide-react";
import { EventWizardProvider, useEventWizard } from "./EventWizardContext";
import { StepIndicator } from "./StepIndicator";
import {
  Step1BasicInfo,
  Step2Subjects,
  Step3Confirm,
  Step4Complete,
} from "./steps";
import type { StepInfo } from "./types";

/**
 * ウィザードの内部コンポーネント
 * コンテキストから状態を取得して表示
 */
function EventWizardContent() {
  const t = useTranslations("event.create");
  const tCommon = useTranslations("common");
  const { currentStep, isPending, goToNextStep, goToPrevStep, handlePublish } =
    useEventWizard();

  // ステップインジケーター用のステップ情報
  const steps: StepInfo[] = [
    { num: 1, label: t("wizard.step1") },
    { num: 2, label: t("wizard.step2") },
    { num: 3, label: t("wizard.step3") },
    { num: 4, label: t("wizard.step4") },
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <StepIndicator steps={steps} currentStep={currentStep} />

        {currentStep === 1 && <Step1BasicInfo />}
        {currentStep === 2 && <Step2Subjects />}
        {currentStep === 3 && <Step3Confirm />}
        {currentStep === 4 && <Step4Complete />}
      </CardContent>

      {currentStep < 4 && (
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={goToPrevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="size-4" />
            {tCommon("back")}
          </Button>

          {currentStep < 3 ? (
            <Button onClick={goToNextStep}>
              {tCommon("next")}
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("wizard.publishing")}
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  {t("wizard.publish")}
                </>
              )}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * イベント作成ウィザードフォーム
 *
 * ステップ形式でイベントを作成するウィザードコンポーネント。
 * コンテキストプロバイダーでラップされており、
 * 各ステップ間で状態を共有します。
 */
export function EventWizardForm() {
  return (
    <EventWizardProvider>
      <EventWizardContent />
    </EventWizardProvider>
  );
}

// 関連コンポーネント・型のエクスポート
export { EventWizardProvider, useEventWizard } from "./EventWizardContext";
export { StepIndicator } from "./StepIndicator";
export * from "./steps";
export * from "./types";
