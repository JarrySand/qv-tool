"use client";

/**
 * ウィザードのステップインジケーター
 * @module event-wizard/StepIndicator
 */

import { Check } from "lucide-react";
import type { StepInfo } from "./types";

interface StepIndicatorProps {
  /** ステップの一覧 */
  steps: StepInfo[];
  /** 現在のステップ番号 */
  currentStep: number;
}

/**
 * ウィザードの進行状況を表示するステップインジケーター
 *
 * @param props - コンポーネントのプロパティ
 * @param props.steps - ステップ情報の配列
 * @param props.currentStep - 現在のステップ番号
 *
 * @example
 * ```tsx
 * <StepIndicator
 *   steps={[
 *     { num: 1, label: "基本情報" },
 *     { num: 2, label: "投票候補" },
 *   ]}
 *   currentStep={1}
 * />
 * ```
 */
export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="relative flex justify-between">
        {/* 背景の線 */}
        <div className="bg-muted-foreground/20 absolute top-5 right-5 left-5 h-0.5" />
        {/* 進捗の線 */}
        <div
          className="bg-primary absolute top-5 left-5 h-0.5 transition-all duration-300"
          style={{
            width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 20px)`,
          }}
        />

        {steps.map((step) => (
          <div key={step.num} className="relative flex flex-col items-center">
            {/* 番号の丸 */}
            <div
              className={`z-10 flex size-10 items-center justify-center rounded-full border-2 font-semibold transition-colors ${
                step.num < currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.num === currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 bg-background text-muted-foreground/50"
              }`}
            >
              {step.num < currentStep ? <Check className="size-5" /> : step.num}
            </div>

            {/* ラベル */}
            <span
              className={`mt-2 text-center text-xs whitespace-nowrap sm:text-sm ${
                step.num <= currentStep
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
