import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// PostgreSQLコネクションプールを作成
// 100人同時アクセス想定: submitVote が 1 投票あたり 5+ クエリを直列実行
// するため max=3 だと即詰まる。Vercel x Neon の推奨は Neon Pooler (pgbouncer
// 経由の URL `?pgbouncer=true`) を使い、pool max は Lambda インスタンス
// あたり 10〜15 程度。
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

// Prismaアダプターを作成
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

globalForPrisma.prisma = prisma;
globalForPrisma.pool = pool;

export default prisma;
