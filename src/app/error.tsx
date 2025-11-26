"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="text-center">
        <AlertTriangle className="mx-auto size-24 text-destructive" />
        <h1 className="mt-6 text-4xl font-bold">{t("common.error")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">500</p>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          Something went wrong. Please try again later.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
          <Button asChild>
            <Link href="/">{t("common.back")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

