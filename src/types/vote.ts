/**
 * 投票関連の型定義
 * @module types/vote
 */

/**
 * 投票の基本情報
 */
export interface VoteInfo {
  /** 投票ID */
  id: string;
  /** イベントID */
  eventId: string;
  /** ユーザーID（Social認証の場合） */
  userId: string | null;
  /** アクセストークンID（個別URL方式の場合） */
  accessTokenId: string | null;
  /** 投票日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * 投票詳細（各候補への投票内容）
 */
export interface VoteDetailInfo {
  /** 投票詳細ID */
  id: string;
  /** 投票ID */
  voteId: string;
  /** 投票候補ID */
  subjectId: string;
  /** 票数 */
  amount: number;
  /** コスト（票数の2乗） */
  cost: number;
}

/**
 * 投票データ（詳細情報付き）
 */
export interface VoteWithDetails extends VoteInfo {
  /** 投票詳細一覧 */
  details: VoteDetailInfo[];
}

/**
 * 投票送信時の入力データ
 */
export interface SubmitVoteData {
  /** イベントID */
  eventId: string;
  /** 投票詳細 */
  details: VoteDetailInput[];
  /** アクセストークン（個別URL方式の場合） */
  token?: string;
  /** 既存の投票ID（更新の場合） */
  existingVoteId?: string;
}

/**
 * 投票詳細の入力データ
 */
export interface VoteDetailInput {
  /** 投票候補ID */
  subjectId: string;
  /** 票数 */
  amount: number;
}

/**
 * 投票状態（UI用）
 */
export interface VoteState {
  /** 各候補への票数 */
  votes: Map<string, number>;
  /** 総消費コスト */
  totalCost: number;
  /** 残りクレジット */
  remainingCredits: number;
}

/**
 * 投票結果の統計情報
 */
export interface VoteStatistics {
  /** 総参加者数 */
  totalParticipants: number;
  /** 総消費クレジット */
  totalCreditsUsed: number;
  /** 利用可能だった総クレジット */
  totalCreditsAvailable: number;
  /** 平均消費クレジット */
  averageCreditsUsed: number;
  /** 参加率（個別URL方式の場合） */
  participationRate: number;
}

/**
 * 投票分布情報
 */
export interface VoteDistribution {
  /** 投票候補ID */
  subjectId: string;
  /** 投票候補タイトル */
  subjectTitle: string;
  /** 分布データ（各票数に対する人数） */
  distribution: VoteDistributionEntry[];
}

/**
 * 投票分布のエントリー
 */
export interface VoteDistributionEntry {
  /** 票数 */
  votes: number;
  /** その票数を投じた人数 */
  count: number;
}

/**
 * 埋もれた選好のデータ
 * 二次投票と一人一票方式の比較用
 */
export interface HiddenPreferences {
  /** 一人一票方式での結果 */
  singleVoteResults: SingleVoteResult[];
  /** 2位以下への投票（埋もれた選好） */
  hiddenVotes: HiddenVoteEntry[];
  /** 埋もれた投票の総数 */
  totalHiddenVotes: number;
  /** QV方式での総投票数 */
  totalQvVotes: number;
}

/**
 * 一人一票方式での結果
 */
export interface SingleVoteResult {
  /** 投票候補ID */
  subjectId: string;
  /** 投票候補タイトル */
  subjectTitle: string;
  /** 得票数 */
  votes: number;
}

/**
 * 埋もれた投票エントリー
 */
export interface HiddenVoteEntry {
  /** 投票候補ID */
  subjectId: string;
  /** 投票候補タイトル */
  subjectTitle: string;
  /** 票数 */
  votes: number;
}

/**
 * CSVエクスポート用のローデータ
 */
export interface RawVoteExport {
  /** 投票ID */
  voteId: string;
  /** 投票日時（ISO形式） */
  votedAt: string;
  /** 投票詳細 */
  details: RawVoteDetailExport[];
  /** 総消費コスト */
  totalCost: number;
}

/**
 * CSVエクスポート用の投票詳細
 */
export interface RawVoteDetailExport {
  /** 投票候補タイトル */
  subjectTitle: string;
  /** 票数 */
  amount: number;
  /** コスト */
  cost: number;
}
