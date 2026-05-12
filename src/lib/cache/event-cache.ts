import { unstable_cache, updateTag } from "next/cache";
import { prisma } from "@/lib/db";

/**
 * updateTag は Next.js 16 では Server Action 外 (Route Handler 等) から呼ぶと
 * throw する。呼び出し元が必ず Server Action とは限らないため try/catch で
 * ラップしておく(キャッシュ無効化が出来ない場合は次回 revalidate まで待つ)。
 */
function safeUpdateTag(tag: string) {
  try {
    updateTag(tag);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`safeUpdateTag: failed to invalidate "${tag}":`, e);
    }
  }
}

/**
 * 指定イベントに紐付くキャッシュ（meta / results / export）をすべて無効化する。
 * id と slug の両方でタグを発行しているので、両方を対象にする。
 */
export function invalidateEventCache(event: {
  id: string;
  slug: string | null;
}) {
  safeUpdateTag(`event-meta-${event.id}`);
  safeUpdateTag(`event-results-${event.id}`);
  safeUpdateTag(`event-export-${event.id}`);
  if (event.slug) {
    safeUpdateTag(`event-meta-${event.slug}`);
    safeUpdateTag(`event-results-${event.slug}`);
    safeUpdateTag(`event-export-${event.slug}`);
  }
}

/**
 * イベントのメタデータ（subjects, _count.votes 含む）をキャッシュ付きで取得。
 * tag: event-meta-{idOrSlug}
 * 投票時 / イベント編集時に invalidate される。
 */
export async function getCachedEventWithSubjects(idOrSlug: string) {
  const cached = await unstable_cache(
    () =>
      prisma.event.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        include: {
          subjects: { orderBy: { order: "asc" } },
          _count: { select: { votes: true } },
        },
      }),
    ["event-meta-with-subjects", idOrSlug],
    { tags: [`event-meta-${idOrSlug}`] }
  )();

  if (!cached) return null;

  // unstable_cache は JSON シリアライズを挟むため Date が文字列化される。
  // 呼び出し側の Date メソッド利用に備えて復元する。
  return {
    ...cached,
    startDate: new Date(cached.startDate),
    endDate: new Date(cached.endDate),
    createdAt: new Date(cached.createdAt),
    updatedAt: new Date(cached.updatedAt),
  };
}
