import Link from "next/link";
import { LanguageSwitcher } from "@/components/features/language-switcher";
import type { Locale } from "@/i18n/config";

interface HeaderProps {
  /** 現在のロケール */
  currentLocale?: Locale;
}

/**
 * サイトヘッダーコンポーネント
 *
 * ロゴとナビゲーション、言語切り替えを含むヘッダー。
 *
 * @param props - コンポーネントのプロパティ
 * @param props.currentLocale - 現在のロケール（未指定時は"ja"）
 */
export function Header({ currentLocale = "ja" }: HeaderProps) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="text-lg font-bold">
          QV-Tool
        </Link>
        <LanguageSwitcher currentLocale={currentLocale} />
      </div>
    </header>
  );
}
