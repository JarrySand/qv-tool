import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isGuildMember } from "@/lib/auth/discord-guild";

export type VotingAuthResult =
  | {
      authenticated: true;
      type: "social";
      userId: string;
      userName: string | null;
      userEmail: string | null;
    }
  | {
      authenticated: true;
      type: "token";
      accessTokenId: string;
      isUsed: boolean;
    }
  | {
      authenticated: false;
      error: string;
      /** Discord ゲート機能: 必要なサーバー名（エラー表示用） */
      requiredGuildName?: string;
    };

/**
 * 投票者の認証を行う
 * @param eventId イベントID
 * @param token 個別投票用トークン（オプション）
 */
export async function authenticateVoter(
  eventId: string,
  token?: string | null
): Promise<VotingAuthResult> {
  // イベント情報を取得
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      votingMode: true,
      startDate: true,
      endDate: true,
      discordGuildId: true,
      discordGuildName: true,
    },
  });

  if (!event) {
    return { authenticated: false, error: "イベントが見つかりません" };
  }

  // 投票期間チェック
  const now = new Date();
  if (now < event.startDate) {
    return { authenticated: false, error: "投票期間がまだ開始されていません" };
  }
  if (now > event.endDate) {
    return { authenticated: false, error: "投票期間は終了しました" };
  }

  // 個別URL方式の場合
  if (event.votingMode === "individual") {
    if (!token) {
      return { authenticated: false, error: "投票用トークンが必要です" };
    }

    const accessToken = await prisma.accessToken.findFirst({
      where: {
        eventId,
        token,
      },
      select: {
        id: true,
        isUsed: true,
      },
    });

    if (!accessToken) {
      return { authenticated: false, error: "無効なトークンです" };
    }

    return {
      authenticated: true,
      type: "token",
      accessTokenId: accessToken.id,
      isUsed: accessToken.isUsed,
    };
  }

  // Social認証の場合（Google/LINE/Discord）
  const session = await auth();

  if (!session?.user?.id) {
    return { authenticated: false, error: "ログインが必要です" };
  }

  // Discord認証でゲート機能が設定されている場合、ギルドメンバーシップを確認
  if (event.votingMode === "discord" && event.discordGuildId) {
    // セッションにDiscordアクセストークンがない場合
    if (!session.discordAccessToken) {
      return {
        authenticated: false,
        error: "Discord認証が必要です",
        requiredGuildName: event.discordGuildName ?? undefined,
      };
    }

    // ギルドメンバーシップを確認
    const isMember = await isGuildMember(
      session.discordAccessToken,
      event.discordGuildId
    );

    if (!isMember) {
      return {
        authenticated: false,
        error: "このサーバーのメンバーのみ投票可能です",
        requiredGuildName: event.discordGuildName ?? undefined,
      };
    }
  }

  return {
    authenticated: true,
    type: "social",
    userId: session.user.id,
    userName: session.user.name ?? null,
    userEmail: session.user.email ?? null,
  };
}

/**
 * 投票済みかどうかをチェック
 */
export async function checkVoteStatus(
  eventId: string,
  authResult: Extract<VotingAuthResult, { authenticated: true }>
): Promise<{
  hasVoted: boolean;
  voteId?: string;
}> {
  if (authResult.type === "token") {
    // トークン認証の場合
    const vote = await prisma.vote.findUnique({
      where: {
        accessTokenId: authResult.accessTokenId,
      },
      select: { id: true },
    });

    return {
      hasVoted: !!vote,
      voteId: vote?.id,
    };
  } else {
    // Social認証の場合
    const vote = await prisma.vote.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: authResult.userId,
        },
      },
      select: { id: true },
    });

    return {
      hasVoted: !!vote,
      voteId: vote?.id,
    };
  }
}

/**
 * イベントの認証方式に基づいて必要な認証情報を取得
 */
export async function getEventAuthRequirement(eventId: string): Promise<{
  found: boolean;
  votingMode?: string;
  requiresToken?: boolean;
  requiresSocialAuth?: boolean;
}> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { votingMode: true },
  });

  if (!event) {
    return { found: false };
  }

  return {
    found: true,
    votingMode: event.votingMode,
    requiresToken: event.votingMode === "individual",
    requiresSocialAuth: event.votingMode === "google" || event.votingMode === "line" || event.votingMode === "discord",
  };
}

