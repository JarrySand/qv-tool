import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    /** Discord OAuth アクセストークン（ギルドメンバーシップ確認用） */
    discordAccessToken?: string;
  }

  interface User extends DefaultUser {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    /** Discord OAuth アクセストークン（ギルドメンバーシップ確認用） */
    discordAccessToken?: string;
  }
}

