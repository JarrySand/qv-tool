"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setLocale } from "@/lib/actions/locale";
import { locales, localeNames, type Locale } from "@/i18n/config";

interface LanguageSwitcherProps {
  currentLocale: Locale;
  variant?: "select" | "button";
}

export function LanguageSwitcher({
  currentLocale,
  variant = "select",
}: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  };

  const ariaLabel =
    currentLocale === "ja" ? "言語を切り替える" : "Switch language";

  if (variant === "button") {
    const nextLocale = currentLocale === "ja" ? "en" : "ja";
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleLocaleChange(nextLocale)}
        disabled={isPending}
        className="gap-2"
        aria-label={`${ariaLabel}: ${localeNames[nextLocale]}`}
      >
        <Globe className="size-4" aria-hidden="true" />
        <span>{localeNames[nextLocale]}</span>
      </Button>
    );
  }

  return (
    <Select
      value={currentLocale}
      onValueChange={(value) => handleLocaleChange(value as Locale)}
      disabled={isPending}
    >
      <SelectTrigger className="w-[130px]" aria-label={ariaLabel}>
        <Globe className="mr-2 size-4" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {localeNames[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
