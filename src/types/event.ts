/**
 * イベント関連の型定義
 * @module types/event
 */

import type { VotingMode } from "@/constants";

/**
 * イベントの基本情報（一覧表示用）
 */
export interface EventSummary {
  /** イベントID */
  id: string;
  /** カスタムスラッグ */
  slug: string | null;
  /** イベントタイトル */
  title: string;
  /** イベント説明 */
  description: string | null;
  /** 投票開始日時 */
  startDate: Date;
  /** 投票終了日時 */
  endDate: Date;
  /** 投票者1人あたりのクレジット数 */
  creditsPerVoter: number;
  /** 認証方式 */
  votingMode: VotingMode;
  /** 公開済み（ロック状態）かどうか */
  isLocked: boolean;
}

/**
 * イベントの詳細情報
 */
export interface EventDetail extends EventSummary {
  /** 管理用トークン */
  adminToken: string;
  /** Discord サーバーID（ゲート機能用） */
  discordGuildId: string | null;
  /** Discord サーバー名（表示用） */
  discordGuildName: string | null;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * イベントと投票候補の複合情報（投票画面用）
 */
export interface EventWithSubjects extends EventSummary {
  /** 投票候補一覧 */
  subjects: SubjectInfo[];
}

/**
 * イベントの管理情報（管理画面用）
 */
export interface EventForAdmin extends EventDetail {
  /** 投票候補一覧 */
  subjects: SubjectInfo[];
  /** 投票数 */
  _count?: {
    votes: number;
    accessTokens: number;
  };
}

/**
 * 投票候補の基本情報
 */
export interface SubjectInfo {
  /** 投票候補ID */
  id: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description: string | null;
  /** 参照URL */
  url: string | null;
  /** 画像URL */
  imageUrl: string | null;
  /** 表示順序 */
  order: number;
}

/**
 * 投票結果付きの投票候補情報
 */
export interface SubjectWithVotes extends SubjectInfo {
  /** 総票数（amountの合計） */
  totalVotes: number;
  /** 総消費クレジット（costの合計） */
  totalCredits: number;
  /** この選択肢に投票した人数 */
  voterCount: number;
}

/**
 * イベントの状態
 */
export type EventStatus = "upcoming" | "ongoing" | "ended";

/**
 * イベントの状態を判定
 * @param startDate - 開始日時
 * @param endDate - 終了日時
 * @returns イベントの状態
 */
export function getEventStatus(startDate: Date, endDate: Date): EventStatus {
  const now = new Date();
  if (now < startDate) return "upcoming";
  if (now > endDate) return "ended";
  return "ongoing";
}

/**
 * イベント作成時の入力データ
 */
export interface CreateEventData {
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** カスタムスラッグ */
  slug?: string;
  /** 開始日時 */
  startDate: Date;
  /** 終了日時 */
  endDate: Date;
  /** クレジット数 */
  creditsPerVoter: number;
  /** 認証方式 */
  votingMode: VotingMode;
  /** Discord サーバーID */
  discordGuildId?: string;
  /** Discord サーバー名 */
  discordGuildName?: string;
}

/**
 * イベント更新時の入力データ
 */
export interface UpdateEventData {
  /** タイトル */
  title?: string;
  /** 説明 */
  description?: string;
  /** 開始日時 */
  startDate?: Date;
  /** 終了日時 */
  endDate?: Date;
}
