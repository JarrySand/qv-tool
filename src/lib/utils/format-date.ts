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

/**
 * Date を `<input type="datetime-local">` 用のローカル時刻文字列に変換する。
 * `"YYYY-MM-DDTHH:MM"` 形式。datetime-local input はタイムゾーン無しの文字列を
 * **ローカル時刻** として解釈するため、`toISOString()` を直接使うと UTC が
 * ローカル時刻のフリで表示されるバグになる。`getTimezoneOffset()` で補正する。
 *
 * 注: クライアント側でのみ呼ぶこと(`new Date().getTimezoneOffset()` は実行環境
 * のタイムゾーンに依存し、Vercel サーバー側で呼ぶと UTC で 0 が返る)。
 */
export function toLocalDateTimeInputString(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
