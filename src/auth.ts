import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import type { Provider } from "next-auth/providers";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import LineProvider from "@/lib/auth/line-provider";

/**
 * Discord OAuthトークンをリフレッシュする
 * 期限切れのアクセストークンを新しいものに更新する
 */
async function refreshDiscordToken(token: JWT): Promise<JWT> {
  if (!token.discordRefreshToken) {
    // リフレッシュトークンがない場合、DBから取得を試みる
    if (token.id) {
      const account = await prisma.account.findFirst({
        where: { userId: token.id as string, provider: "discord" },
        select: { refresh_token: true },
      });
      if (!account?.refresh_token) {
        // リフレッシュ不可能 → トークンをクリアして再認証を促す
        token.discordAccessToken = undefined;
        token.discordAccessTokenExpiresAt = undefined;
        return token;
      }
      token.discordRefreshToken = account.refresh_token;
    } else {
      token.discordAccessToken = undefined;
      return token;
    }
  }

  try {
    const response = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.discordRefreshToken!,
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      console.error("Failed to refresh Discord token:", await response.text());
      // リフレッシュ失敗 → トークンをクリアして再認証を促す
      token.discordAccessToken = undefined;
      token.discordAccessTokenExpiresAt = undefined;
      token.discordRefreshToken = undefined;
      return token;
    }

    const data = await response.json();

    // JWTのトークンを更新
    token.discordAccessToken = data.access_token;
    token.discordAccessTokenExpiresAt =
      Math.floor(Date.now() / 1000) + data.expires_in;
    token.discordRefreshToken = data.refresh_token ?? token.discordRefreshToken;

    // DBのAccountレコードも更新
    if (token.id) {
      await prisma.account.updateMany({
        where: { userId: token.id as string, provider: "discord" },
        data: {
          access_token: data.access_token,
          expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
          refresh_token: data.refresh_token ?? token.discordRefreshToken,
        },
      });
    }

    return token;
  } catch (error) {
    console.error("Error refreshing Discord token:", error);
    token.discordAccessToken = undefined;
    token.discordAccessTokenExpiresAt = undefined;
    return token;
  }
}

// プロバイダー設定
const providers: Provider[] = [];

// Google認証（環境変数が設定されている場合のみ有効化）
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// LINE認証（環境変数が設定されている場合のみ有効化）
if (process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET) {
  providers.push(
    LineProvider({
      clientId: process.env.LINE_CHANNEL_ID,
      clientSecret: process.env.LINE_CHANNEL_SECRET,
    })
  );
}

// Discord認証（環境変数が設定されている場合のみ有効化）
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: {
          // identify: ユーザー情報, email: メールアドレス
          // guilds: サーバー一覧（ゲート機能用）
          // guilds.members.read: サーバー内のロール情報取得（ロール制限機能用）
          scope: "identify email guilds guilds.members.read",
        },
      },
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  // シークレットキー（本番環境では必ず環境変数で設定）
  secret: (() => {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET environment variable is required in production"
      );
    }
    return secret ?? "dev-secret-key-for-local-development-only";
  })(),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    // JWTコールバック: トークンにユーザー情報を追加
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // ログインしたプロバイダーを保存
      if (account?.provider) {
        token.provider = account.provider;
      }
      // Discord認証の場合、アクセストークン・リフレッシュトークン・有効期限を保存
      if (account?.provider === "discord" && account.access_token) {
        token.discordAccessToken = account.access_token;
        token.discordAccessTokenExpiresAt = account.expires_at;
        token.discordRefreshToken = account.refresh_token ?? undefined;
      }

      // Discord トークンの有効期限チェック → 期限切れならリフレッシュ
      if (
        token.provider === "discord" &&
        token.discordAccessToken &&
        token.discordAccessTokenExpiresAt
      ) {
        const now = Math.floor(Date.now() / 1000);
        // 5分前にリフレッシュ（余裕を持たせる）
        if (token.discordAccessTokenExpiresAt - now < 300) {
          return refreshDiscordToken(token);
        }
      }

      return token;
    },
    // セッションコールバック: セッションにユーザーIDを追加
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      // ログインしたプロバイダーをセッションに追加
      if (token.provider) {
        session.provider = token.provider as string;
      }
      // Discord アクセストークンをセッションに追加（ギルドメンバーシップ確認用）
      if (token.discordAccessToken) {
        session.discordAccessToken = token.discordAccessToken as string;
      }
      return session;
    },
    // 認証許可コールバック
    async signIn({ user, account }) {
      // LINEはemail不要、その他のプロバイダーはemail必須
      if (account?.provider !== "line" && !user.email) {
        return false;
      }
      return true;
    },
  },
  // イベントフック
  events: {
    async signIn({ user }) {
      if (process.env.NODE_ENV === "development") {
        console.log(`User signed in: ${user.email}`);
      }
    },
  },
  // デバッグモード（開発環境のみ）
  debug: process.env.NODE_ENV === "development",
});
