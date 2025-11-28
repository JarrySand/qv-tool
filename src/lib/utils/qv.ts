/**
 * Quadratic Voting (二次投票) 計算ユーティリティ
 */

/**
 * 票数からコスト（消費クレジット）を計算
 * コスト = 票数²
 */
export function calculateCost(votes: number): number {
  return votes * votes;
}

/**
 * コストから最大票数を計算
 * 票数 = √コスト (切り捨て)
 */
export function calculateMaxVotes(credits: number): number {
  return Math.floor(Math.sqrt(credits));
}

/**
 * 複数の投票からの総コストを計算
 */
export function calculateTotalCost(votes: { amount: number }[]): number {
  return votes.reduce((sum, v) => sum + calculateCost(v.amount), 0);
}

/**
 * 残りクレジットを計算
 */
export function calculateRemainingCredits(
  totalCredits: number,
  votes: { amount: number }[]
): number {
  return totalCredits - calculateTotalCost(votes);
}

/**
 * 特定の対象に追加で投票可能な最大票数を計算
 * 現在の投票状態と残りクレジットから算出
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
