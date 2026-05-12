import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

interface LineVerifyResponse {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  name?: string;
  picture?: string;
  email?: string;
}

/**
 * LIFF (LINE Front-end Framework) 用の Credentials プロバイダー。
 *
 * LIFF SDK が返す ID トークンを受け取り、LINE の verify API で検証して
 * ユーザーレコードを作成・取得する。通常の LINE OAuth と同じ providerAccountId
 * を使うため、両方のフローで同じ User レコードに紐付く。
 *
 * @see https://developers.line.biz/en/reference/line-login/#verify-id-token
 */
export const liffCredentials = Credentials({
  id: "line-liff",
  name: "LINE (LIFF)",
  credentials: {
    idToken: { label: "ID Token", type: "text" },
  },
  async authorize(credentials) {
    const idToken = credentials?.idToken;
    if (typeof idToken !== "string" || !idToken) return null;

    const clientId = process.env.LINE_CHANNEL_ID;
    if (!clientId) {
      console.error("LINE_CHANNEL_ID is not set");
      return null;
    }

    // LINE の verify API で ID トークンを検証
    const verifyRes = await fetch("https://api.line.me/oauth2/v2.1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: clientId,
      }),
    });

    if (!verifyRes.ok) {
      const errText = await verifyRes.text();
      console.error("LIFF id_token verification failed:", errText);
      return null;
    }

    const verified = (await verifyRes.json()) as LineVerifyResponse;
    const lineUserId = verified.sub;
    if (!lineUserId) return null;

    // 既存 Account を検索 → 無ければ作成、というフローはレース条件で
    // 二重 User 作成や Account.@@unique 違反を起こすので、リトライ込みで
    // 安全に処理する。
    return await findOrCreateLineUser(lineUserId, verified);
  },
});

async function findOrCreateLineUser(
  lineUserId: string,
  verified: LineVerifyResponse
) {
  // まず既存 Account を検索
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "line",
        providerAccountId: lineUserId,
      },
    },
    include: { user: true },
  });

  if (existingAccount) {
    // プロフィール情報を最新に更新（差分がある場合のみ）
    if (
      (verified.name && verified.name !== existingAccount.user.name) ||
      (verified.picture && verified.picture !== existingAccount.user.image)
    ) {
      await prisma.user.update({
        where: { id: existingAccount.userId },
        data: {
          ...(verified.name && { name: verified.name }),
          ...(verified.picture && { image: verified.picture }),
        },
      });
    }
    return {
      id: existingAccount.user.id,
      name: verified.name ?? existingAccount.user.name,
      email: existingAccount.user.email,
      image: verified.picture ?? existingAccount.user.image,
    };
  }

  // 新規ユーザー作成 + Account 紐付け
  // 同時リクエストが両方ここに到達した場合、二人目は Account の
  // @@unique([provider, providerAccountId]) 制約で P2002 を投げる。
  // そのケースを catch して既存 User を返すことで、二重 User 作成を防ぐ。
  try {
    const user = await prisma.user.create({
      data: {
        name: verified.name ?? null,
        email: verified.email ?? null,
        image: verified.picture ?? null,
        accounts: {
          create: {
            type: "oidc",
            provider: "line",
            providerAccountId: lineUserId,
          },
        },
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      // 並行リクエストで先に作られた User を取得し直して返す
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "line",
            providerAccountId: lineUserId,
          },
        },
        include: { user: true },
      });
      if (account) {
        return {
          id: account.user.id,
          name: account.user.name,
          email: account.user.email,
          image: account.user.image,
        };
      }
    }
    throw error;
  }
}
