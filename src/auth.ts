import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
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

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    // JWTコールバック: トークンにユーザー情報を追加
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // セッションコールバック: セッションにユーザーIDを追加
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
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
      console.log(`User signed in: ${user.email}`);
    },
  },
  // デバッグモード（開発環境のみ）
  debug: process.env.NODE_ENV === "development",
});

