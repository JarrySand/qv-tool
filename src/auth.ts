import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import type { Provider } from "next-auth/providers";
import { prisma } from "@/lib/db";
import LineProvider from "@/lib/auth/line-provider";

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
      // Discord認証の場合、アクセストークンを保存（ギルドメンバーシップ確認用）
      if (account?.provider === "discord" && account.access_token) {
        token.discordAccessToken = account.access_token;
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
    async signIn({ user }) {
      // ここで追加の認証チェックを行う（例：特定ドメインのみ許可など）
      if (!user.email) {
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
