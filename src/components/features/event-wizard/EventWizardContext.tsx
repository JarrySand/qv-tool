"use client";

/**
 * イベントウィザードの状態管理コンテキスト
 * @module event-wizard/EventWizardContext
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import {
  createEventWithSubjects,
  type SubjectInput,
} from "@/lib/actions/event";
import { toLocalDateTimeInputString } from "@/lib/utils/format-date";
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

  // 基本情報
  // datetime-local の初期値はマウント後に useEffect でセットする。
  // SSR 時(UTC)とブラウザ(JST)で日時文字列がズレるのを避けるため。
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    slug: "",
    startDate: "",
    endDate: "",
    creditsPerVoter: 100,
    votingMode: "individual",
    discordGuildId: "",
    discordGuildName: "",
    discordRequiredRoleId: "",
    discordRequiredRoleName: "",
    endMessage: "",
  });

  // マウント後にローカル時刻でデフォルト値を埋める。
  // SSR 時(UTC)と client(JST)で `new Date()` の表現が異なるため、
  // useEffect でクライアントマウント後にだけ値をセットする必要がある。
  // 一回きりの初期化なので cascading render は発生しない。
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData((prev) => {
      if (prev.startDate || prev.endDate) return prev;
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return {
        ...prev,
        startDate: toLocalDateTimeInputString(now),
        endDate: toLocalDateTimeInputString(nextWeek),
      };
    });
  }, []);

  // 投票候補
  const [subjects, setSubjects] = useState<SubjectInput[]>([]);

  // 作成されたイベント
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null);

  // Discord ゲート設定
  const [enableGuildGate, setEnableGuildGate] = useState(false);

  // Discord ロール制限設定
  const [enableRoleGate, setEnableRoleGate] = useState(false);

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
        discordRequiredRoleId:
          formData.votingMode === "discord" && enableGuildGate && enableRoleGate
            ? formData.discordRequiredRoleId || undefined
            : undefined,
        discordRequiredRoleName:
          formData.votingMode === "discord" && enableGuildGate && enableRoleGate
            ? formData.discordRequiredRoleName || undefined
            : undefined,
        endMessage: formData.endMessage || undefined,
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
    enableRoleGate,
    setEnableRoleGate,
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
