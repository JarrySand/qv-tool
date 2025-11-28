// src/constants/index.ts

/**
 * クレジット設定
 * Credits configuration
 */
export const CREDITS = {
  DEFAULT: 100,
  MIN: 1,
  MAX: 1000,
} as const;

/**
 * スラッグ設定
 * Slug configuration
 */
export const SLUG = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 50,
  PATTERN: /^[a-z0-9-]+$/,
} as const;

/**
 * タイトル・説明の文字数制限
 * Text limits for title and description
 */
export const TEXT_LIMITS = {
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 2000,
} as const;

/**
 * レート制限設定
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  /** 投票の最大リクエスト数（ウィンドウ内） */
  VOTE_MAX_REQUESTS: 5,
  /** 投票のレート制限ウィンドウ（ミリ秒） */
  VOTE_WINDOW_MS: 60 * 1000,
  /** イベント作成の最大リクエスト数（ウィンドウ内） */
  EVENT_CREATE_MAX_REQUESTS: 10,
  /** イベント作成のレート制限ウィンドウ（ミリ秒） */
  EVENT_CREATE_WINDOW_MS: 60 * 60 * 1000,
} as const;

/**
 * 投票モード
 * Voting modes
 */
export const VOTING_MODES = [
  "individual",
  "google",
  "line",
  "discord",
] as const;
export type VotingMode = (typeof VOTING_MODES)[number];

/**
 * トークン設定
 * Token configuration
 */
export const TOKEN = {
  /** トークンの長さ（文字数） */
  LENGTH: 32,
  /** 一度に生成できるトークンの最大数 */
  MAX_GENERATE_COUNT: 100,
} as const;

/**
 * ページネーション設定
 * Pagination configuration
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
