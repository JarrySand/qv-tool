/**
 * アクセストークン関連の型定義
 * @module types/access-token
 */

/**
 * アクセストークンの基本情報
 */
export interface AccessTokenInfo {
  /** トークンID */
  id: string;
  /** イベントID */
  eventId: string;
  /** トークン文字列 */
  token: string;
  /** 使用済みかどうか */
  isUsed: boolean;
  /** 作成日時 */
  createdAt: Date;
}

/**
 * トークン生成結果
 */
export interface GeneratedToken {
  /** トークンID */
  id: string;
  /** トークン文字列 */
  token: string;
  /** 使用済みかどうか */
  isUsed: boolean;
  /** 作成日時 */
  createdAt: Date;
}

/**
 * トークン検証結果
 */
export interface TokenValidationResult {
  /** 有効かどうか */
  valid: boolean;
  /** トークンID（有効な場合） */
  tokenId?: string;
  /** 使用済みかどうか（有効な場合） */
  isUsed?: boolean;
  /** エラーメッセージ（無効な場合） */
  error?: string;
}

/**
 * トークン統計情報
 */
export interface TokenStatistics {
  /** 発行済みトークン数 */
  totalIssued: number;
  /** 使用済みトークン数 */
  totalUsed: number;
  /** 未使用トークン数 */
  totalUnused: number;
  /** 使用率（%） */
  usageRate: number;
}
