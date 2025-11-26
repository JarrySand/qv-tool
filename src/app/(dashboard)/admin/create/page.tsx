import { EventCreateForm } from "@/components/features/event-create-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "イベント作成 | QV-Tool",
  description: "新しい二次投票イベントを作成します",
};

export default function CreateEventPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          トップへ戻る
        </Link>

        <div className="flex justify-center">
          <EventCreateForm />
        </div>
      </div>
    </main>
  );
}

