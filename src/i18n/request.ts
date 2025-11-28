import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export const locales = ["ja", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ja";

export default getRequestConfig(async () => {
  // 1. クッキーから言語を取得
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  // 2. Accept-Languageヘッダーから言語を検出
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";
  const browserLocale = acceptLanguage.split(",")[0]?.split("-")[0];

  // 3. 優先順位: クッキー > ブラウザ設定 > デフォルト
  let locale: Locale = defaultLocale;

  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else if (browserLocale && locales.includes(browserLocale as Locale)) {
    locale = browserLocale as Locale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
