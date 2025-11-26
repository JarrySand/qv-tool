"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createEvent, type CreateEventResult } from "@/lib/actions/event";
import { Loader2 } from "lucide-react";

type FormErrors = Record<string, string[]>;

export function EventCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // 開始日のデフォルト: 今日
  const today = new Date();
  const defaultStartDate = today.toISOString().slice(0, 16);

  // 終了日のデフォルト: 7日後
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const defaultEndDate = nextWeek.toISOString().slice(0, 16);

  async function handleSubmit(formData: FormData) {
    setErrors({});
    setGeneralError(null);

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const slug = formData.get("slug") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const creditsPerVoter = parseInt(
      formData.get("creditsPerVoter") as string,
      10
    );
    const votingMode = formData.get("votingMode") as
      | "individual"
      | "google"
      | "line";

    startTransition(async () => {
      const result: CreateEventResult = await createEvent({
        title,
        description: description || undefined,
        slug: slug || undefined,
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr),
        creditsPerVoter: isNaN(creditsPerVoter) ? 100 : creditsPerVoter,
        votingMode,
      });

      if (result.success) {
        // 作成完了画面へ遷移（adminTokenを渡す）
        router.push(
          `/admin/created?id=${result.event.id}&token=${result.event.adminToken}`
        );
      } else {
        setGeneralError(result.error);
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        }
      }
    });
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">新しい投票イベントを作成</CardTitle>
        <CardDescription>
          Quadratic Voting（二次投票）形式のイベントを作成します。
          誰でも作成可能です。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {/* 一般エラー */}
          {generalError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {generalError}
            </div>
          )}

          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="title">
              タイトル <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="例: チーム旅行先を決めよう！"
              required
              maxLength={100}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-destructive">
                {errors.title[0]}
              </p>
            )}
          </div>

          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="description">説明（任意）</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="イベントの説明を入力してください..."
              maxLength={2000}
              rows={4}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description[0]}
              </p>
            )}
          </div>

          {/* カスタムスラッグ */}
          <div className="space-y-2">
            <Label htmlFor="slug">カスタムURL（任意）</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/events/</span>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder="my-event"
                pattern="[a-z0-9-]+"
                minLength={3}
                maxLength={50}
                className="flex-1"
                aria-invalid={!!errors.slug}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              英小文字、数字、ハイフンのみ。空欄の場合は自動生成されます。
            </p>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug[0]}</p>
            )}
          </div>

          {/* 期間 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                開始日時 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="datetime-local"
                required
                defaultValue={defaultStartDate}
                aria-invalid={!!errors.startDate}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {errors.startDate[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">
                終了日時 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                required
                defaultValue={defaultEndDate}
                aria-invalid={!!errors.endDate}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate[0]}</p>
              )}
            </div>
          </div>

          {/* クレジット数 */}
          <div className="space-y-2">
            <Label htmlFor="creditsPerVoter">1人あたりのクレジット数</Label>
            <Input
              id="creditsPerVoter"
              name="creditsPerVoter"
              type="number"
              min={1}
              max={1000}
              defaultValue={100}
              aria-invalid={!!errors.creditsPerVoter}
            />
            <p className="text-xs text-muted-foreground">
              投票者が使用できるクレジット。1票=1クレジット、2票=4クレジット（票数の2乗）
            </p>
            {errors.creditsPerVoter && (
              <p className="text-sm text-destructive">
                {errors.creditsPerVoter[0]}
              </p>
            )}
          </div>

          {/* 認証方式 */}
          <div className="space-y-2">
            <Label htmlFor="votingMode">
              投票者の認証方式 <span className="text-destructive">*</span>
            </Label>
            <Select name="votingMode" defaultValue="individual" required>
              <SelectTrigger id="votingMode" className="w-full">
                <SelectValue placeholder="認証方式を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">個別URL方式</span>
                    <span className="text-xs text-muted-foreground">
                      参加者ごとにユニークなURLを発行
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="google">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Googleアカウント</span>
                    <span className="text-xs text-muted-foreground">
                      Googleでログインして投票
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="line">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">LINEアカウント</span>
                    <span className="text-xs text-muted-foreground">
                      LINEでログインして投票
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.votingMode && (
              <p className="text-sm text-destructive">{errors.votingMode[0]}</p>
            )}
          </div>

          {/* 送信ボタン */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                作成中...
              </>
            ) : (
              "イベントを作成"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

