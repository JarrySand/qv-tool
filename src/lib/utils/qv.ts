/**
 * Quadratic Voting（二次投票）計算ユーティリティ
 *
 * 二次投票は、投票者が複数の選択肢に票を配分できる投票方式です。
 * 各票のコストは票数の2乗になるため、強い選好には高いコストがかかります。
 *
 * ## コスト計算
 * - 1票 = 1クレジット
 * - 2票 = 4クレジット
 * - 3票 = 9クレジット
 * - n票 = n²クレジット
 *
 * @module lib/utils/qv
 *
 * @example
 * ```ts
 * import { calculateCost, calculateRemainingCredits } from "@/lib/utils/qv";
 *
 * // 3票に必要なコストを計算
 * const cost = calculateCost(3); // 9
 *
 * // 残りクレジットを計算
 * const remaining = calculateRemainingCredits(100, [
 *   { amount: 3 }, // 9
 *   { amount: 2 }, // 4
 * ]); // 87
 * ```
 */

/**
 * 票数からコスト（消費クレジット）を計算
 *
 * コスト = 票数² という二次投票の基本公式を適用します。
 *
 * @param votes - 票数
 * @returns コスト（消費クレジット）
 *
 * @example
 * ```ts
 * calculateCost(1); // 1
 * calculateCost(2); // 4
 * calculateCost(3); // 9
 * calculateCost(10); // 100
 * ```
 */
export function calculateCost(votes: number): number {
  return votes * votes;
}

/**
 * コストから最大票数を計算
 *
 * 与えられたクレジットで投票可能な最大票数を算出します。
 * 票数 = √クレジット（切り捨て）
 *
 * @param credits - 利用可能なクレジット
 * @returns 投票可能な最大票数
 *
 * @example
 * ```ts
 * calculateMaxVotes(100); // 10
 * calculateMaxVotes(50);  // 7
 * calculateMaxVotes(9);   // 3
 * ```
 */
export function calculateMaxVotes(credits: number): number {
  return Math.floor(Math.sqrt(credits));
}

/**
 * 複数の投票からの総コストを計算
 *
 * @param votes - 投票の配列（各要素にamountプロパティ）
 * @returns 総コスト
 *
 * @example
 * ```ts
 * calculateTotalCost([
 *   { amount: 3 }, // 9
 *   { amount: 2 }, // 4
 *   { amount: 1 }, // 1
 * ]); // 14
 * ```
 */
export function calculateTotalCost(votes: { amount: number }[]): number {
  return votes.reduce((sum, v) => sum + calculateCost(v.amount), 0);
}

/**
 * 残りクレジットを計算
 *
 * 総クレジットから消費済みコストを引いた残りを算出します。
 *
 * @param totalCredits - 投票者の総クレジット
 * @param votes - 現在の投票配列
 * @returns 残りクレジット
 *
 * @example
 * ```ts
 * calculateRemainingCredits(100, [{ amount: 5 }]); // 75
 * ```
 */
export function calculateRemainingCredits(
  totalCredits: number,
  votes: { amount: number }[]
): number {
  return totalCredits - calculateTotalCost(votes);
}

/**
 * 特定の対象に追加で投票可能な最大票数を計算
 *
 * 現在の投票を取り消した場合のコストを戻し入れた上で、
 * 投票可能な最大票数を計算します。
 *
 * @param currentVotes - 現在の票数
 * @param remainingCredits - 残りクレジット
 * @returns 投票可能な最大票数
 *
 * @example
 * ```ts
 * // 現在2票（コスト4）、残り20クレジットの場合
 * // 戻し入れで24クレジット → 最大4票
 * calculateMaxAdditionalVotes(2, 20); // 4
 * ```
 */
export function calculateMaxAdditionalVotes(
  currentVotes: number,
  remainingCredits: number
): number {
  // 現在のコストを戻して、総利用可能クレジットを計算
  const currentCost = calculateCost(currentVotes);
  const availableCredits = remainingCredits + currentCost;

  // 利用可能クレジットで投票可能な最大票数
  return calculateMaxVotes(availableCredits);
}

/**
 * 投票の増減がクレジット内に収まるかチェック
 *
 * 票数を変更した場合にクレジット上限を超えないか判定します。
 *
 * @param currentVotes - 現在の票数
 * @param newVotes - 変更後の票数
 * @param remainingCredits - 残りクレジット
 * @returns 変更可能な場合はtrue
 *
 * @example
 * ```ts
 * // 現在1票、残り5クレジット → 2票への変更は可能か?
 * // 変更コスト: 4 - 1 = 3 ≤ 5
 * canChangeVote(1, 2, 5); // true
 *
 * // 3票への変更は?
 * // 変更コスト: 9 - 1 = 8 > 5
 * canChangeVote(1, 3, 5); // false
 * ```
 */
export function canChangeVote(
  currentVotes: number,
  newVotes: number,
  remainingCredits: number
): boolean {
  const currentCost = calculateCost(currentVotes);
  const newCost = calculateCost(newVotes);
  const costDifference = newCost - currentCost;

  return costDifference <= remainingCredits;
}
