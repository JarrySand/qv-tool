/**
 * イベントウィザードフォームの型定義
 * @module event-wizard/types
 */

import type { SubjectInput } from "@/lib/actions/event";

/**
 * フォームのエラー状態
 * フィールド名をキー、エラーメッセージ配列を値とするオブジェクト
 */
export type FormErrors = Record<string, string[]>;

/**
 * イベント作成フォームのデータ型
 */
export interface EventFormData {
  /** イベントタイトル */
  title: string;
  /** イベント説明 */
  description: string;
  /** カスタムURL用スラッグ */
  slug: string;
  /** 投票開始日時 */
  startDate: string;
  /** 投票終了日時 */
  endDate: string;
  /** 投票者1人あたりのクレジット数 */
  creditsPerVoter: number;
  /** 認証方式 */
  votingMode: "individual" | "google" | "line" | "discord";
  /** Discord サーバーID（ゲート機能用） */
  discordGuildId: string;
  /** Discord サーバー名（表示用） */
  discordGuildName: string;
  /** Discord 必須ロールID（ロール制限機能用） */
  discordRequiredRoleId: string;
  /** Discord 必須ロール名（表示用） */
  discordRequiredRoleName: string;
}

/**
 * 作成されたイベントの型
 */
export interface CreatedEvent {
  /** イベントID */
  id: string;
  /** カスタムスラッグ（未設定の場合はnull） */
  slug: string | null;
  /** イベントタイトル */
  title: string;
  /** 管理用トークン */
  adminToken: string;
  /** 投票開始日時 */
  startDate: Date;
  /** 投票終了日時 */
  endDate: Date;
  /** 投票者1人あたりのクレジット数 */
  creditsPerVoter: number;
  /** 認証方式 */
  votingMode: string;
  /** 投票候補一覧 */
  subjects: {
    id: string;
    title: string;
    description: string | null;
  }[];
}

/**
 * ステップインジケーターの各ステップ情報
 */
export interface StepInfo {
  /** ステップ番号 */
  num: number;
  /** ステップのラベル */
  label: string;
}

/**
 * ウィザードのコンテキスト型
 * 全ステップで共有される状態と操作を定義
 */
export interface EventWizardContextType {
  // 現在のステップ
  currentStep: number;
  totalSteps: number;

  // フォームデータ
  formData: EventFormData;
  updateFormData: (field: keyof EventFormData, value: string | number) => void;

  // 投票候補
  subjects: SubjectInput[];
  setSubjects: React.Dispatch<React.SetStateAction<SubjectInput[]>>;

  // エラー状態
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  generalError: string | null;
  setGeneralError: React.Dispatch<React.SetStateAction<string | null>>;

  // 作成されたイベント
  createdEvent: CreatedEvent | null;
  setCreatedEvent: React.Dispatch<React.SetStateAction<CreatedEvent | null>>;

  // Discord ゲート設定
  enableGuildGate: boolean;
  setEnableGuildGate: React.Dispatch<React.SetStateAction<boolean>>;

  // Discord ロール制限設定
  enableRoleGate: boolean;
  setEnableRoleGate: React.Dispatch<React.SetStateAction<boolean>>;

  // トランジション状態
  isPending: boolean;

  // ステップ操作
  goToNextStep: () => void;
  goToPrevStep: () => void;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;

  // イベント公開
  handlePublish: () => void;
}

/**
 * 投票モードのラベル型
 */
export type VotingModeLabels = {
  [K in EventFormData["votingMode"]]: string;
};
