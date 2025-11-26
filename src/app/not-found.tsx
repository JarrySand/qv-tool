import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="text-center">
        <FileQuestion className="mx-auto size-24 text-muted-foreground" />
        <h1 className="mt-6 text-4xl font-bold">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Page Not Found
        </p>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">{t("common.back")}</Link>
        </Button>
      </div>
    </div>
  );
}

