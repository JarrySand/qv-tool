"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("event.create");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [votingMode, setVotingMode] = useState<string>("individual");
  const [enableGuildGate, setEnableGuildGate] = useState(false);

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
    const votingModeValue = formData.get("votingMode") as
      | "individual"
      | "google"
      | "line"
      | "discord";
    const discordGuildId = formData.get("discordGuildId") as string;
    const discordGuildName = formData.get("discordGuildName") as string;

    startTransition(async () => {
      const result: CreateEventResult = await createEvent({
        title,
        description: description || undefined,
        slug: slug || undefined,
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr),
        creditsPerVoter: isNaN(creditsPerVoter) ? 100 : creditsPerVoter,
        votingMode: votingModeValue,
        // Discord ゲート機能が有効な場合のみ送信
        discordGuildId:
          votingModeValue === "discord" && enableGuildGate
            ? discordGuildId || undefined
            : undefined,
        discordGuildName:
          votingModeValue === "discord" && enableGuildGate
            ? discordGuildName || undefined
            : undefined,
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
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {/* 一般エラー */}
          {generalError && (
            <div
              role="alert"
              aria-live="assertive"
              className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-4 text-sm"
            >
              {generalError}
            </div>
          )}

          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {t("titleLabel")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder={t("titlePlaceholder")}
              required
              maxLength={100}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-destructive text-sm">
                {errors.title[0]}
              </p>
            )}
          </div>

          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t("descriptionLabel")}（{tCommon("optional")}）
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder={t("descriptionPlaceholder")}
              maxLength={2000}
              rows={4}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-destructive text-sm">
                {errors.description[0]}
              </p>
            )}
          </div>

          {/* カスタムスラッグ */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              {t("customUrlLabel")}（{tCommon("optional")}）
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">/events/</span>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder={t("customUrlPlaceholder")}
                pattern="[a-z0-9-]+"
                minLength={3}
                maxLength={50}
                className="flex-1"
                aria-invalid={!!errors.slug}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {t("customUrlHint")}
            </p>
            {errors.slug && (
              <p className="text-destructive text-sm">{errors.slug[0]}</p>
            )}
          </div>

          {/* 期間 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                {t("startDateLabel")}{" "}
                <span className="text-destructive">*</span>
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
                <p className="text-destructive text-sm">
                  {errors.startDate[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">
                {t("endDateLabel")} <span className="text-destructive">*</span>
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
                <p className="text-destructive text-sm">{errors.endDate[0]}</p>
              )}
            </div>
          </div>

          {/* クレジット数 */}
          <div className="space-y-2">
            <Label htmlFor="creditsPerVoter">{t("creditsLabel")}</Label>
            <Input
              id="creditsPerVoter"
              name="creditsPerVoter"
              type="number"
              min={1}
              max={1000}
              defaultValue={100}
              aria-invalid={!!errors.creditsPerVoter}
            />
            <p className="text-muted-foreground text-xs">{t("creditsHint")}</p>
            {errors.creditsPerVoter && (
              <p className="text-destructive text-sm">
                {errors.creditsPerVoter[0]}
              </p>
            )}
          </div>

          {/* 認証方式 */}
          <div className="space-y-2">
            <Label htmlFor="votingMode">
              {t("authModeLabel")} <span className="text-destructive">*</span>
            </Label>
            <Select
              name="votingMode"
              defaultValue="individual"
              required
              onValueChange={(value) => {
                setVotingMode(value);
                // Discord以外の場合はゲート機能を無効化
                if (value !== "discord") {
                  setEnableGuildGate(false);
                }
              }}
            >
              <SelectTrigger id="votingMode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">
                      {t("authModes.individual.title")}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("authModes.individual.description")}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="google">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">
                      {t("authModes.google.title")}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("authModes.google.description")}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="line">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">
                      {t("authModes.line.title")}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("authModes.line.description")}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="discord">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">
                      {t("authModes.discord.title")}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("authModes.discord.description")}
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.votingMode && (
              <p className="text-destructive text-sm">{errors.votingMode[0]}</p>
            )}
          </div>

          {/* Discord サーバーゲート設定 */}
          {votingMode === "discord" && (
            <div className="border-border bg-muted/30 space-y-4 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableGuildGate"
                  checked={enableGuildGate}
                  onChange={(e) => setEnableGuildGate(e.target.checked)}
                  className="border-input size-4 rounded"
                />
                <Label htmlFor="enableGuildGate" className="cursor-pointer">
                  {t("discordGate.enableLabel")}
                </Label>
              </div>

              {enableGuildGate && (
                <div className="space-y-4 pl-7">
                  <div className="space-y-2">
                    <Label htmlFor="discordGuildId">
                      {t("discordGate.guildIdLabel")}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="discordGuildId"
                      name="discordGuildId"
                      type="text"
                      placeholder={t("discordGate.guildIdPlaceholder")}
                      pattern="\d{17,19}"
                      required={enableGuildGate}
                      aria-invalid={!!errors.discordGuildId}
                    />
                    <p className="text-muted-foreground text-xs">
                      {t("discordGate.guildIdHint")}
                    </p>
                    {errors.discordGuildId && (
                      <p className="text-destructive text-sm">
                        {errors.discordGuildId[0]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discordGuildName">
                      {t("discordGate.guildNameLabel")}（{tCommon("optional")}）
                    </Label>
                    <Input
                      id="discordGuildName"
                      name="discordGuildName"
                      type="text"
                      placeholder={t("discordGate.guildNamePlaceholder")}
                      maxLength={100}
                      aria-invalid={!!errors.discordGuildName}
                    />
                    <p className="text-muted-foreground text-xs">
                      {t("discordGate.guildNameHint")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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
                {t("creating")}
              </>
            ) : (
              t("submitButton")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
