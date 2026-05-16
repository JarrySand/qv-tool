/**
 * LINE アプリ内ブラウザ(WebView) で開くと OAuth の state Cookie が消えて
 * ログインに失敗する。URL に ?openExternalBrowser=1 を付けると LINE が
 * WebView を使わず Safari/Chrome 等で直接開くようになる(LINE 公式仕様)。
 *
 * @see https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme/#opening-external-browsers
 */
export function withLineExternalBrowser(url: string): string {
  if (url.includes("openExternalBrowser=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}openExternalBrowser=1`;
}

/**
 * イベント共有用URLを生成する。
 *
 * - token あり (個別投票方式の各トークン URL): LINE 認証不要なので
 *   /events/{id}/vote 直リンク + ?openExternalBrowser=1。LIFF を経由しない。
 * - votingMode === "individual": そもそも LINE 認証不要なので LIFF を経由しない。
 *   /events/{id} 直リンク + ?openExternalBrowser=1。
 * - token なし + LIFF_ID 設定済み: 自ドメインの /r/{id} 中継 URL を返す。
 *   LINE オープンチャットは liff.line.me 直リンクの送信をブロックするため、
 *   自ドメイン経由で liff.line.me へ 302 リダイレクトさせる。
 *   既存の liff.line.me/{liffId}?eventId=... 直リンク (/liff ページ経由) も
 *   引き続き有効。
 * - token なし + LIFF_ID 未設定: /events/{id} 直リンク + ?openExternalBrowser=1
 */
export function buildEventShareUrl(
  eventIdOrSlug: string,
  options?: { token?: string; baseUrl?: string; votingMode?: string }
): string {
  const { token, baseUrl, votingMode } = options ?? {};
  const origin =
    baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");

  // 個別トークン方式: LINE認証不要なので LIFF を使わず /vote へ直接リンク
  if (token) {
    return withLineExternalBrowser(
      `${origin}/events/${eventIdOrSlug}/vote?token=${token}`
    );
  }

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  // 個別投票方式は LINE 認証フローを使わないので、LIFF_ID が設定されていても
  // LIFF を使わない。LINE/Google/Discord 認証のイベントだけ LIFF を使う。
  if (liffId && votingMode !== "individual") {
    return `${origin}/r/${eventIdOrSlug}`;
  }

  return withLineExternalBrowser(`${origin}/events/${eventIdOrSlug}`);
}
