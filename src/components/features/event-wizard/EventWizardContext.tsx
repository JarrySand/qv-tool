"use client";

/**
 * イベントウィザードの状態管理コンテキスト
 * @module event-wizard/EventWizardContext
 */

import {
  createContext,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import {
  createEventWithSubjects,
  type SubjectInput,
} from "@/lib/actions/event";
import type {
  EventWizardContextType,
  EventFormData,
  FormErrors,
  CreatedEvent,
} from "./types";

const EventWizardContext = createContext<EventWizardContextType | null>(null);

/**
 * イベントウィザードコンテキストを取得するフック
 * @returns イベントウィザードのコンテキスト
 * @throws コンテキストプロバイダー外で使用された場合
 */
export function useEventWizard() {
  const context = useContext(EventWizardContext);
  if (!context) {
    throw new Error("useEventWizard must be used within EventWizardProvider");
  }
  return context;
}

interface EventWizardProviderProps {
  children: ReactNode;
}

/**
 * イベントウィザードの状態を提供するプロバイダーコンポーネント
 *
 * @param props - プロバイダーのプロパティ
 * @param props.children - 子コンポーネント
 */
export function EventWizardProvider({ children }: EventWizardProviderProps) {
  const t = useTranslations("event.create");
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // ステップ管理
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // 日付のデフォルト値
  const today = new Date();
  const defaultStartDate = today.toISOString().slice(0, 16);
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const defaultEndDate = nextWeek.toISOString().slice(0, 16);

  // 基本情報
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    slug: "",
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    creditsPerVoter: 100,
    votingMode: "individual",
    discordGuildId: "",
    discordGuildName: "",
  });

  // 投票候補
  const [subjects, setSubjects] = useState<SubjectInput[]>([]);

  // 作成されたイベント
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null);

  // Discord ゲート設定
  const [enableGuildGate, setEnableGuildGate] = useState(false);

  /**
   * フォームデータを更新する
   */
  const updateFormData = (
    field: keyof EventFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Step 1 のバリデーション
   */
  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = [t("validation.titleRequired")];
    }
    if (!formData.startDate) {
      newErrors.startDate = [t("validation.startDateRequired")];
    }
    if (!formData.endDate) {
      newErrors.endDate = [t("validation.endDateRequired")];
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = [t("validation.endDateAfterStart")];
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Step 2 のバリデーション
   */
  const validateStep2 = (): boolean => {
    if (subjects.length === 0) {
      setGeneralError(t("wizard.atLeastOneSubject"));
      return false;
    }
    setGeneralError(null);
    return true;
  };

  /**
   * 次のステップへ進む
   */
  const goToNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  /**
   * 前のステップへ戻る
   */
  const goToPrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  /**
   * イベントを公開する
   */
  const handlePublish = () => {
    setErrors({});
    setGeneralError(null);

    startTransition(async () => {
      const result = await createEventWithSubjects({
        title: formData.title,
        description: formData.description || undefined,
        slug: formData.slug || undefined,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        creditsPerVoter: formData.creditsPerVoter,
        votingMode: formData.votingMode,
        discordGuildId:
          formData.votingMode === "discord" && enableGuildGate
            ? formData.discordGuildId || undefined
            : undefined,
        discordGuildName:
          formData.votingMode === "discord" && enableGuildGate
            ? formData.discordGuildName || undefined
            : undefined,
        subjects,
      });

      if (result.success) {
        setCreatedEvent(result.event);
        setCurrentStep(4);
      } else {
        setGeneralError(result.error);
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        }
      }
    });
  };

  const value: EventWizardContextType = {
    currentStep,
    totalSteps,
    formData,
    updateFormData,
    subjects,
    setSubjects,
    errors,
    setErrors,
    generalError,
    setGeneralError,
    createdEvent,
    setCreatedEvent,
    enableGuildGate,
    setEnableGuildGate,
    isPending,
    goToNextStep,
    goToPrevStep,
    setCurrentStep,
    handlePublish,
  };

  return (
    <EventWizardContext.Provider value={value}>
      {children}
    </EventWizardContext.Provider>
  );
}
