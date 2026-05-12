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
