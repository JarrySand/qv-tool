import { getTranslations } from "next-intl/server";
import { EventWizardForm } from "@/components/features/event-wizard-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "イベントを作成 | QV-Tool",
  description: "Create a new quadratic voting event",
};

export default async function CreateEventPage() {
  const t = await getTranslations();

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("common.back")}
        </Link>

        <div className="flex justify-center">
          <EventWizardForm />
        </div>
      </div>
    </main>
  );
}
