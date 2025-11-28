/**
 * 型定義のエントリーポイント
 *
 * このモジュールは、アプリケーション全体で使用される
 * ドメイン型定義をエクスポートします。
 *
 * @module types
 *
 * @example
 * ```tsx
 * import type { EventSummary, VoteInfo, AccessTokenInfo } from "@/types";
 *
 * function EventCard({ event }: { event: EventSummary }) {
 *   return <div>{event.title}</div>;
 * }
 * ```
 */

// イベント関連の型
export type {
  EventSummary,
  EventDetail,
  EventWithSubjects,
  EventForAdmin,
  SubjectInfo,
  SubjectWithVotes,
  EventStatus,
  CreateEventData,
  UpdateEventData,
} from "./event";

export { getEventStatus } from "./event";

// 投票関連の型
export type {
  VoteInfo,
  VoteDetailInfo,
  VoteWithDetails,
  SubmitVoteData,
  VoteDetailInput,
  VoteState,
  VoteStatistics,
  VoteDistribution,
  VoteDistributionEntry,
  HiddenPreferences,
  SingleVoteResult,
  HiddenVoteEntry,
  RawVoteExport,
  RawVoteDetailExport,
} from "./vote";

// アクセストークン関連の型
export type {
  AccessTokenInfo,
  GeneratedToken,
  TokenValidationResult,
  TokenStatistics,
} from "./access-token";

// 定数からの型もエクスポート
export type { VotingMode } from "@/constants";
