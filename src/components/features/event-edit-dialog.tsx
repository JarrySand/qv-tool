"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Loader2 } from "lucide-react";
import { updateEvent } from "@/lib/actions/event";

type EventData = {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  hasVotes: boolean;
};

type Props = {
  event: EventData;
  adminToken: string;
  onClose: () => void;
  onUpdate: (data: Partial<EventData>) => void;
};

export function EventEditDialog({
  event,
  adminToken,
  onClose,
  onUpdate,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = async (formData: FormData) => {
    setError(null);

    const input = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      ...(!event.hasVotes && {
        startDate: new Date(formData.get("startDate") as string),
        endDate: new Date(formData.get("endDate") as string),
      }),
    };

    startTransition(async () => {
      const result = await updateEvent(event.id, adminToken, input);
      if (result.success) {
        onUpdate({
          title: input.title,
          description: input.description ?? null,
          ...(input.startDate && { startDate: input.startDate }),
          ...(input.endDate && { endDate: input.endDate }),
        });
      } else {
        setError(result.error);
      }
    });
  };

  // 日時をローカルフォーマットに変換
  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ダイアログ */}
      <div className="bg-background relative z-10 mx-4 w-full max-w-lg rounded-lg border shadow-xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">イベント設定</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* フォーム */}
        <form action={handleSubmit} className="space-y-4 p-4">
          {error && (
            <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
              {error}
            </div>
          )}

          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">
              タイトル <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={event.title}
              required
              maxLength={100}
            />
          </div>

          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">説明（任意）</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={event.description ?? ""}
              maxLength={2000}
              rows={4}
            />
          </div>

          {/* 期間（投票開始後は編集不可） */}
          {!event.hasVotes && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">開始日時</Label>
                <Input
                  id="edit-startDate"
                  name="startDate"
                  type="datetime-local"
                  defaultValue={formatDateTime(event.startDate)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">終了日時</Label>
                <Input
                  id="edit-endDate"
                  name="endDate"
                  type="datetime-local"
                  defaultValue={formatDateTime(event.endDate)}
                />
              </div>
            </div>
          )}

          {event.hasVotes && (
            <p className="text-muted-foreground text-sm">
              ※ 投票が開始されているため、期間の変更はできません
            </p>
          )}

          {/* ボタン */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
