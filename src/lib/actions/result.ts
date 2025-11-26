"use server";

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";

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
}

/**
 * イベントの投票結果を取得
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
  };
}

/**
 * ローデータ（個別投票データ）を取得
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
 * 集計データをCSV形式で取得
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
 * ローデータをCSV形式で取得
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

