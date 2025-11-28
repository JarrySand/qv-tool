"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pencil,
  Trash2,
  GripVertical,
  ExternalLink,
  Plus,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import {
  createSubject,
  updateSubject,
  deleteSubject,
  type CreateSubjectInput,
} from "@/lib/actions/subject";

type Subject = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  order: number;
};

type Props = {
  subjects: Subject[];
  eventId: string;
  adminToken: string;
  isLocked: boolean;
};

export function SubjectList({
  subjects: initialSubjects,
  eventId,
  adminToken,
  isLocked,
}: Props) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (formData: FormData) => {
    setError(null);
    const input: CreateSubjectInput = {
      eventId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      url: (formData.get("url") as string) || undefined,
      imageUrl: (formData.get("imageUrl") as string) || undefined,
    };

    startTransition(async () => {
      const result = await createSubject(eventId, adminToken, input);
      if (result.success) {
        setSubjects((prev) => [...prev, result.subject]);
        setShowAddForm(false);
      } else {
        setError(result.error);
      }
    });
  };

  const handleUpdate = async (subjectId: string, formData: FormData) => {
    setError(null);
    const input = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      url: (formData.get("url") as string) || undefined,
      imageUrl: (formData.get("imageUrl") as string) || undefined,
    };

    startTransition(async () => {
      const result = await updateSubject(eventId, adminToken, subjectId, input);
      if (result.success) {
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  title: input.title ?? s.title,
                  description: input.description ?? null,
                  url: input.url ?? null,
                  imageUrl: input.imageUrl ?? null,
                }
              : s
          )
        );
        setEditingId(null);
      } else {
        setError(result.error);
      }
    });
  };

  const handleDelete = async (subjectId: string) => {
    if (!confirm("この投票対象を削除しますか？")) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteSubject(eventId, adminToken, subjectId);
      if (result.success) {
        setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
      } else {
        setError(result.error);
      }
    });
  };

  if (subjects.length === 0 && !showAddForm) {
    return (
      <div className="py-8 text-center">
        <ImageIcon className="text-muted-foreground/50 mx-auto mb-4 size-12" />
        <p className="text-muted-foreground mb-4">
          まだ投票対象が登録されていません
        </p>
        {!isLocked && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="size-4" />
            投票対象を追加
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
          {error}
        </div>
      )}

      {/* 投票対象一覧 */}
      <div className="space-y-3">
        {subjects.map((subject) => (
          <Card key={subject.id} className="py-3">
            <CardContent className="p-0 px-4">
              {editingId === subject.id ? (
                <SubjectForm
                  subject={subject}
                  onSubmit={(formData) => handleUpdate(subject.id, formData)}
                  onCancel={() => setEditingId(null)}
                  isPending={isPending}
                />
              ) : (
                <div className="flex items-start gap-3">
                  {!isLocked && (
                    <GripVertical className="text-muted-foreground/50 mt-1 size-5 cursor-move" />
                  )}
                  {subject.imageUrl && (
                    <Image
                      src={subject.imageUrl}
                      alt={subject.title}
                      width={64}
                      height={64}
                      className="size-16 rounded-md object-cover"
                      unoptimized={subject.imageUrl.startsWith("data:")}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{subject.title}</h3>
                    {subject.description && (
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {subject.description}
                      </p>
                    )}
                    {subject.url && (
                      <a
                        href={subject.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        リンク
                      </a>
                    )}
                  </div>
                  {!isLocked && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingId(subject.id)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(subject.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 追加フォーム */}
      {showAddForm && (
        <Card className="border-dashed">
          <CardContent className="pt-4">
            <SubjectForm
              onSubmit={handleAdd}
              onCancel={() => setShowAddForm(false)}
              isPending={isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* 追加ボタン */}
      {!showAddForm && !isLocked && (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="size-4" />
          投票対象を追加
        </Button>
      )}
    </div>
  );
}

type SubjectFormProps = {
  subject?: Subject;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
};

function SubjectForm({
  subject,
  onSubmit,
  onCancel,
  isPending,
}: SubjectFormProps) {
  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">
          タイトル <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          defaultValue={subject?.title}
          placeholder="投票対象のタイトル"
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明（任意）</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={subject?.description ?? ""}
          placeholder="投票対象の説明..."
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="url">リンクURL（任意）</Label>
          <Input
            id="url"
            name="url"
            type="url"
            defaultValue={subject?.url ?? ""}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">画像URL（任意）</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={subject?.imageUrl ?? ""}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
        >
          <X className="size-4" />
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
  );
}
