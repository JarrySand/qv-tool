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

    // 既存の LINE Account を検索
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
      // プロフィール情報を最新に更新
      if (verified.name || verified.picture) {
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
    // type は LINE OAuth (type: "oidc") と合わせて "oidc" にしておく。
    // 同一 LINE ユーザーが OAuth/LIFF どちらでログインしても
    // Account レコードの形式が揃う。
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
  },
});
