"use server";

/**
 * 投票結果取得用 Server Actions
 *
 * イベントの投票結果、統計情報、CSVエクスポート機能を提供します。
 *
 * @module lib/actions/result
 */

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";

/**
 * 投票候補ごとの結果データ
 */
export interface SubjectResult {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  url: string | null;
  totalVotes: number; // 総票数（amount の合計）
  totalCost: number; // 総消費クレジット（cost の合計）
  voterCount: number; // この選択肢に投票した人数
}

export interface EventStatistics {
  totalParticipants: number; // 総参加者数
  totalCreditsUsed: number; // 総消費クレジット
  totalCreditsAvailable: number; // 利用可能だった総クレジット
  averageCreditsUsed: number; // 平均消費クレジット
  participationRate: number; // 参加率（トークン発行数に対する投票数の割合、個別投票の場合）
}

export interface VoteDistribution {
  subjectId: string;
  subjectTitle: string;
  distribution: { votes: number; count: number }[]; // 各票数に対する人数
}

export interface HiddenPreferencesData {
  // 一人一票の場合の結果（各投票者の1位のみ1票）
  singleVoteResults: {
    subjectId: string;
    subjectTitle: string;
    votes: number;
  }[];
  // 2位以下の投票（＝埋もれた選好）
  hiddenVotes: { subjectId: string; subjectTitle: string; votes: number }[];
  // 総計
  totalHiddenVotes: number;
  totalQvVotes: number;
}

export interface RawVoteData {
  voteId: string;
  votedAt: string;
  details: {
    subjectTitle: string;
    amount: number;
    cost: number;
  }[];
  totalCost: number;
}

export interface EventResultData {
  event: {
    id: string;
    slug: string | null;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    creditsPerVoter: number;
    votingMode: string;
  };
  results: SubjectResult[];
  statistics: EventStatistics;
  distributions: VoteDistribution[];
  hiddenPreferences: HiddenPreferencesData;
}

/**
 * イベントの投票結果を取得するServer Action
 *
 * イベントIDまたはスラッグで投票結果を取得します。
 * 各候補の得票数、統計情報、投票分布、埋もれた選好データを含みます。
 *
 * @param eventIdOrSlug - イベントIDまたはカスタムスラッグ
 * @returns 投票結果データ（イベントが存在しない場合はnull）
 *
 * @example
 * ```ts
 * const results = await getEventResults("my-event-slug");
 * if (results) {
 *   console.log(`Total participants: ${results.statistics.totalParticipants}`);
 *   results.results.forEach(r => {
 *     console.log(`${r.title}: ${r.totalVotes} votes`);
 *   });
 * }
 * ```
 */
export async function getEventResults(
  eventIdOrSlug: string
): Promise<EventResultData | null> {
  // イベント情報を取得
  const event = await prisma.event.findFirst({
    where: {
      OR: [{ id: eventIdOrSlug }, { slug: eventIdOrSlug }],
    },
    include: {
      subjects: {
        orderBy: { order: "asc" },
      },
      votes: {
        include: {
          details: true,
        },
      },
      accessTokens: {
        select: { id: true },
      },
    },
  });

  if (!event) {
    return null;
  }

  // 各選択肢の結果を集計
  const results: SubjectResult[] = event.subjects.map((subject) => {
    const subjectVotes = event.votes.flatMap((vote) =>
      vote.details.filter((d) => d.subjectId === subject.id)
    );

    return {
      id: subject.id,
      title: subject.title,
      description: subject.description,
      imageUrl: subject.imageUrl,
      url: subject.url,
      totalVotes: subjectVotes.reduce((sum, d) => sum + d.amount, 0),
      totalCost: subjectVotes.reduce((sum, d) => sum + d.cost, 0),
      voterCount: subjectVotes.filter((d) => d.amount > 0).length,
    };
  });

  // 統計情報の計算
  const totalParticipants = event.votes.length;
  const totalCreditsUsed = event.votes.reduce(
    (sum, vote) => sum + vote.details.reduce((s, d) => s + d.cost, 0),
    0
  );
  const totalCreditsAvailable = totalParticipants * event.creditsPerVoter;
  const averageCreditsUsed =
    totalParticipants > 0 ? totalCreditsUsed / totalParticipants : 0;

  // 参加率の計算（個別投票モードの場合）
  let participationRate = 0;
  if (event.votingMode === "individual" && event.accessTokens.length > 0) {
    participationRate = (totalParticipants / event.accessTokens.length) * 100;
  }

  const statistics: EventStatistics = {
    totalParticipants,
    totalCreditsUsed,
    totalCreditsAvailable,
    averageCreditsUsed,
    participationRate,
  };

  // 投票分布の計算
  const distributions: VoteDistribution[] = event.subjects.map((subject) => {
    const voteCounts = new Map<number, number>();

    event.votes.forEach((vote) => {
      const detail = vote.details.find((d) => d.subjectId === subject.id);
      const amount = detail?.amount ?? 0;
      voteCounts.set(amount, (voteCounts.get(amount) ?? 0) + 1);
    });

    const distribution = Array.from(voteCounts.entries())
      .map(([votes, count]) => ({ votes, count }))
      .sort((a, b) => a.votes - b.votes);

    return {
      subjectId: subject.id,
      subjectTitle: subject.title,
      distribution,
    };
  });

  // 埋もれた選好の計算
  // 各投票者の1位（最大票数の選択肢）を特定し、2位以下への投票を「埋もれた選好」とする
  const singleVoteCounts = new Map<string, number>(); // 一人一票での得票
  const hiddenVoteCounts = new Map<string, number>(); // 2位以下への投票

  event.votes.forEach((vote) => {
    // この投票者の各選択肢への票数を取得
    const voterDetails = vote.details.filter((d) => d.amount > 0);

    if (voterDetails.length === 0) return;

    // 1位を特定（最大票数の選択肢、同点の場合は最初の1つ）
    const maxAmount = Math.max(...voterDetails.map((d) => d.amount));
    const topSubjectId = voterDetails.find(
      (d) => d.amount === maxAmount
    )?.subjectId;

    voterDetails.forEach((detail) => {
      if (detail.subjectId === topSubjectId) {
        // 1位の選択肢 → 一人一票で1票
        singleVoteCounts.set(
          detail.subjectId,
          (singleVoteCounts.get(detail.subjectId) ?? 0) + 1
        );
      } else {
        // 2位以下の選択肢 → 埋もれた選好
        hiddenVoteCounts.set(
          detail.subjectId,
          (hiddenVoteCounts.get(detail.subjectId) ?? 0) + detail.amount
        );
      }
    });
  });

  const singleVoteResults = event.subjects
    .map((subject) => ({
      subjectId: subject.id,
      subjectTitle: subject.title,
      votes: singleVoteCounts.get(subject.id) ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes);

  const hiddenVotes = event.subjects
    .map((subject) => ({
      subjectId: subject.id,
      subjectTitle: subject.title,
      votes: hiddenVoteCounts.get(subject.id) ?? 0,
    }))
    .filter((h) => h.votes > 0)
    .sort((a, b) => b.votes - a.votes);

  const totalHiddenVotes = hiddenVotes.reduce((sum, h) => sum + h.votes, 0);
  const totalQvVotes = results.reduce((sum, r) => sum + r.totalVotes, 0);

  const hiddenPreferences: HiddenPreferencesData = {
    singleVoteResults,
    hiddenVotes,
    totalHiddenVotes,
    totalQvVotes,
  };

  return {
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      creditsPerVoter: event.creditsPerVoter,
      votingMode: event.votingMode,
    },
    results,
    statistics,
    distributions,
    hiddenPreferences,
  };
}

/**
 * 個別投票データ（ローデータ）を取得するServer Action
 *
 * 管理者向けに各投票の詳細データを取得します。
 * adminToken認証が必要です。
 *
 * @param eventIdOrSlug - イベントIDまたはカスタムスラッグ
 * @param adminToken - 管理用トークン
 * @returns 投票データ配列（認証失敗時はエラー）
 *
 * @example
 * ```ts
 * const data = await getRawVoteData(eventId, adminToken);
 * if (!("error" in data)) {
 *   data.forEach(vote => {
 *     console.log(`Vote ${vote.voteId} at ${vote.votedAt}`);
 *   });
 * }
 * ```
 */
export async function getRawVoteData(
  eventIdOrSlug: string,
  adminToken: string
): Promise<RawVoteData[] | { error: string }> {
  const t = await getTranslations("errors");

  // イベントの存在確認とadminToken検証
  const event = await prisma.event.findFirst({
    where: {
      OR: [{ id: eventIdOrSlug }, { slug: eventIdOrSlug }],
    },
  });

  if (!event) {
    return { error: t("eventNotFound") };
  }

  if (event.adminToken !== adminToken) {
    return { error: t("noPermission") };
  }

  // 投票データを取得
  const votes = await prisma.vote.findMany({
    where: { eventId: event.id },
    include: {
      details: {
        include: {
          subject: {
            select: { title: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return votes.map((vote) => ({
    voteId: vote.id,
    votedAt: vote.createdAt.toISOString(),
    details: vote.details.map((d) => ({
      subjectTitle: d.subject.title,
      amount: d.amount,
      cost: d.cost,
    })),
    totalCost: vote.details.reduce((sum, d) => sum + d.cost, 0),
  }));
}

/**
 * 集計データをCSV形式で取得するServer Action
 *
 * 投票結果の集計をCSV形式で出力します。
 * 順位、タイトル、得票数、消費クレジット、投票者数を含みます。
 *
 * @param eventIdOrSlug - イベントIDまたはカスタムスラッグ
 * @returns CSV形式の文字列（エラー時はエラーオブジェクト）
 *
 * @example
 * ```ts
 * const csv = await getResultsCsv(eventId);
 * if (typeof csv === "string") {
 *   // CSVファイルとしてダウンロード
 *   downloadFile(csv, "results.csv");
 * }
 * ```
 */
export async function getResultsCsv(
  eventIdOrSlug: string
): Promise<string | { error: string }> {
  const tErrors = await getTranslations("errors");
  const tCsv = await getTranslations("csv");
  const result = await getEventResults(eventIdOrSlug);

  if (!result) {
    return { error: tErrors("eventNotFound") };
  }

  // CSVヘッダー
  const headers = [
    tCsv("rank"),
    tCsv("title"),
    tCsv("totalVotes"),
    tCsv("creditsUsed"),
    tCsv("voterCount"),
  ].join(",");

  // 結果をソートして順位付け
  const sortedResults = [...result.results].sort(
    (a, b) => b.totalVotes - a.totalVotes
  );

  const rows = sortedResults.map((r, index) =>
    [
      index + 1,
      `"${r.title.replace(/"/g, '""')}"`,
      r.totalVotes,
      r.totalCost,
      r.voterCount,
    ].join(",")
  );

  return [headers, ...rows].join("\n");
}

/**
 * ローデータをCSV形式で取得するServer Action
 *
 * 管理者向けに個別投票データをCSV形式で出力します。
 * adminToken認証が必要です。
 *
 * @param eventIdOrSlug - イベントIDまたはカスタムスラッグ
 * @param adminToken - 管理用トークン
 * @returns CSV形式の文字列（エラー時はエラーオブジェクト）
 *
 * @example
 * ```ts
 * const csv = await getRawDataCsv(eventId, adminToken);
 * if (typeof csv === "string") {
 *   // CSVファイルとしてダウンロード
 *   downloadFile(csv, "raw_data.csv");
 * }
 * ```
 */
export async function getRawDataCsv(
  eventIdOrSlug: string,
  adminToken: string
): Promise<string | { error: string }> {
  const tErrors = await getTranslations("errors");
  const tCsv = await getTranslations("csv");
  const rawData = await getRawVoteData(eventIdOrSlug, adminToken);

  if ("error" in rawData) {
    return rawData;
  }

  // イベント情報を取得
  const event = await prisma.event.findFirst({
    where: {
      OR: [{ id: eventIdOrSlug }, { slug: eventIdOrSlug }],
    },
    include: {
      subjects: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!event) {
    return { error: tErrors("eventNotFound") };
  }

  // CSVヘッダー
  const subjectTitles = event.subjects.map((s) => s.title);
  const headers = [
    tCsv("voteId"),
    tCsv("votedAt"),
    ...subjectTitles.map((title) => `"${title.replace(/"/g, '""')}"`),
    tCsv("totalCost"),
  ].join(",");

  // 各投票データの行
  const rows = rawData.map((vote) => {
    const detailMap = new Map(
      vote.details.map((d) => [d.subjectTitle, d.amount])
    );
    const amounts = event.subjects.map((s) => detailMap.get(s.title) ?? 0);

    return [vote.voteId, vote.votedAt, ...amounts, vote.totalCost].join(",");
  });

  return [headers, ...rows].join("\n");
}
