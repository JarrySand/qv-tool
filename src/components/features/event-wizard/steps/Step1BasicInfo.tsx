"use client";

/**
 * Step 1: 基本情報入力
 * @module event-wizard/steps/Step1BasicInfo
 */

import { useTranslations } from "next-intl";
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
import { useEventWizard } from "../EventWizardContext";

/**
 * 基本情報入力ステップコンポーネント
 * イベントのタイトル、説明、期間、認証方式などを設定
 */
export function Step1BasicInfo() {
  const t = useTranslations("event.create");
  const tCommon = useTranslations("common");

  const {
    formData,
    updateFormData,
    errors,
    generalError,
    enableGuildGate,
    setEnableGuildGate,
    enableRoleGate,
    setEnableRoleGate,
  } = useEventWizard();

  return (
    <div className="space-y-6">
      {generalError && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
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
          value={formData.title}
          onChange={(e) => updateFormData("title", e.target.value)}
          placeholder={t("titlePlaceholder")}
          maxLength={100}
        />
        {errors.title && (
          <p className="text-destructive text-sm">{errors.title[0]}</p>
        )}
      </div>

      {/* 説明 */}
      <div className="space-y-2">
        <Label htmlFor="description">
          {t("descriptionLabel")}（{tCommon("optional")}）
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData("description", e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          maxLength={2000}
          rows={3}
        />
      </div>

      {/* カスタムURL */}
      <div className="space-y-2">
        <Label htmlFor="slug">
          {t("customUrlLabel")}（{tCommon("optional")}）
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">/events/</span>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => updateFormData("slug", e.target.value)}
            placeholder={t("customUrlPlaceholder")}
            pattern="[a-z0-9-]+"
            minLength={3}
            maxLength={50}
            className="flex-1"
          />
        </div>
        <p className="text-muted-foreground text-xs">{t("customUrlHint")}</p>
        {errors.slug && (
          <p className="text-destructive text-sm">{errors.slug[0]}</p>
        )}
      </div>

      {/* 期間 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            {t("startDateLabel")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => updateFormData("startDate", e.target.value)}
          />
          {errors.startDate && (
            <p className="text-destructive text-sm">{errors.startDate[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">
            {t("endDateLabel")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => updateFormData("endDate", e.target.value)}
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
          type="number"
          min={1}
          max={1000}
          value={formData.creditsPerVoter}
          onChange={(e) =>
            updateFormData("creditsPerVoter", parseInt(e.target.value) || 100)
          }
        />
        <p className="text-muted-foreground text-xs">{t("creditsHint")}</p>
      </div>

      {/* 認証方式 */}
      <div className="space-y-2">
        <Label htmlFor="votingMode">
          {t("authModeLabel")} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.votingMode}
          onValueChange={(v) => updateFormData("votingMode", v)}
        >
          <SelectTrigger id="votingMode">
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
                <span className="font-medium">{t("authModes.line.title")}</span>
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
      </div>

      {/* Discord サーバーゲート設定 */}
      {formData.votingMode === "discord" && (
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
                  value={formData.discordGuildId}
                  onChange={(e) =>
                    updateFormData("discordGuildId", e.target.value)
                  }
                  placeholder={t("discordGate.guildIdPlaceholder")}
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
                  value={formData.discordGuildName}
                  onChange={(e) =>
                    updateFormData("discordGuildName", e.target.value)
                  }
                  placeholder={t("discordGate.guildNamePlaceholder")}
                  maxLength={100}
                />
                <p className="text-muted-foreground text-xs">
                  {t("discordGate.guildNameHint")}
                </p>
              </div>

              {/* ロール制限設定 */}
              <div className="border-border bg-muted/20 space-y-4 rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enableRoleGate"
                    checked={enableRoleGate}
                    onChange={(e) => setEnableRoleGate(e.target.checked)}
                    className="border-input size-4 rounded"
                  />
                  <Label htmlFor="enableRoleGate" className="cursor-pointer">
                    {t("discordGate.roleEnableLabel")}
                  </Label>
                </div>

                {enableRoleGate && (
                  <div className="space-y-4 pl-7">
                    <div className="space-y-2">
                      <Label htmlFor="discordRequiredRoleId">
                        {t("discordGate.roleIdLabel")}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="discordRequiredRoleId"
                        value={formData.discordRequiredRoleId}
                        onChange={(e) =>
                          updateFormData(
                            "discordRequiredRoleId",
                            e.target.value
                          )
                        }
                        placeholder={t("discordGate.roleIdPlaceholder")}
                      />
                      <p className="text-muted-foreground text-xs">
                        {t("discordGate.roleIdHint")}
                      </p>
                      {errors.discordRequiredRoleId && (
                        <p className="text-destructive text-sm">
                          {errors.discordRequiredRoleId[0]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discordRequiredRoleName">
                        {t("discordGate.roleNameLabel")}（{tCommon("optional")}
                        ）
                      </Label>
                      <Input
                        id="discordRequiredRoleName"
                        value={formData.discordRequiredRoleName}
                        onChange={(e) =>
                          updateFormData(
                            "discordRequiredRoleName",
                            e.target.value
                          )
                        }
                        placeholder={t("discordGate.roleNamePlaceholder")}
                        maxLength={100}
                      />
                      <p className="text-muted-foreground text-xs">
                        {t("discordGate.roleNameHint")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
