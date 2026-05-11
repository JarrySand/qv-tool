import { unstable_cache, updateTag } from "next/cache";
import { prisma } from "@/lib/db";

/**
 * 指定イベントに紐付くキャッシュ（meta / results / export）をすべて無効化する。
 * id と slug の両方でタグを発行しているので、両方を対象にする。
 */
export function invalidateEventCache(event: {
  id: string;
  slug: string | null;
}) {
  updateTag(`event-meta-${event.id}`);
  updateTag(`event-results-${event.id}`);
  updateTag(`event-export-${event.id}`);
  if (event.slug) {
    updateTag(`event-meta-${event.slug}`);
    updateTag(`event-results-${event.slug}`);
    updateTag(`event-export-${event.slug}`);
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
