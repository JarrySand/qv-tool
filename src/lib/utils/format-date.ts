/**
 * 日付表示用フォーマッタ。
 *
 * Vercel(US) のサーバーや UTC の Lambda で `toLocaleDateString()` を引数なしで
 * 呼ぶと "12/31/2026" のような英語フォーマットになる。日本ユーザー向けの
 * 表示なので明示的に ja-JP / Asia/Tokyo を指定する。
 */

const DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateJa(value: Date | string): string {
  return DATE_FORMATTER.format(new Date(value));
}

export function formatDateTimeJa(value: Date | string): string {
  return DATE_TIME_FORMATTER.format(new Date(value));
}
