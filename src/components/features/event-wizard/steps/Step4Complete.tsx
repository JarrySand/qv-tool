"use client";

/**
 * Step 4: 完了画面
 * @module event-wizard/steps/Step4Complete
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Check,
  AlertTriangle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { generateAccessTokens } from "@/lib/actions/access-token";
import { useEventWizard } from "../EventWizardContext";

/**
 * 完了画面ステップコンポーネント
 * 作成完了後のURL表示とトークン生成機能
 */
export function Step4Complete() {
  const t = useTranslations("event.create");
  const router = useRouter();
  const { createdEvent } = useEventWizard();

  // トークン生成用
  const [tokenCount, setTokenCount] = useState(10);
  const [generatedTokens, setGeneratedTokens] = useState<string[]>([]);
  const [isGeneratingTokens, setIsGeneratingTokens] = useState(false);

  // コピー状態
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  if (!createdEvent) return null;

  const eventPath = createdEvent.slug
    ? `/events/${createdEvent.slug}`
    : `/events/${createdEvent.id}`;
  const eventUrl = `${baseUrl}${eventPath}`;
  const adminUrl = `${baseUrl}/admin/${createdEvent.id}?token=${createdEvent.adminToken}`;

  /**
   * トークンを一括生成
   */
  const handleGenerateTokens = async () => {
    setIsGeneratingTokens(true);

    const result = await generateAccessTokens(
      createdEvent.id,
      createdEvent.adminToken,
      tokenCount
    );

    if (result.success) {
      setGeneratedTokens(result.tokens.map((t) => t.token));
    }
    setIsGeneratingTokens(false);
  };

  /**
   * クリップボードにコピー
   */
  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 成功メッセージ */}
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
          <Check className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{t("wizard.publishComplete")}</h2>
          <p className="text-muted-foreground">{createdEvent.title}</p>
        </div>
      </div>

      {/* 管理URL警告 */}
      <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
            <div>
              <CardTitle className="text-amber-800 dark:text-amber-200">
                {t("wizard.adminUrl")}
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                {t("wizard.adminUrlWarning")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={adminUrl}
              readOnly
              className="bg-white font-mono text-sm dark:bg-black"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(adminUrl, "admin")}
            >
              {copied === "admin" ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* イベントURL */}
      <Card>
        <CardHeader>
          <CardTitle>{t("wizard.publicUrl")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={eventUrl} readOnly className="font-mono text-sm" />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(eventUrl, "event")}
            >
              {copied === "event" ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
            <Button variant="outline" asChild>
              <a href={eventPath} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 個別URL方式の場合のトークン生成 */}
      {createdEvent.votingMode === "individual" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("wizard.generateTokens")}</CardTitle>
            <CardDescription>{t("wizard.tokenDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedTokens.length === 0 ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label>{t("wizard.tokenCount")}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={tokenCount}
                    onChange={(e) =>
                      setTokenCount(parseInt(e.target.value) || 10)
                    }
                    className="w-24"
                  />
                </div>
                <Button
                  onClick={handleGenerateTokens}
                  disabled={isGeneratingTokens}
                >
                  {isGeneratingTokens ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {t("wizard.generate")}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  {t("wizard.tokensGenerated", {
                    count: generatedTokens.length,
                  })}
                </p>
                <div className="max-h-60 space-y-1 overflow-y-auto rounded border p-2">
                  {generatedTokens.map((token, index) => (
                    <div
                      key={token}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <code className="flex-1 truncate font-mono">
                        {baseUrl}
                        {eventPath}?token={token}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() =>
                          copyToClipboard(
                            `${baseUrl}${eventPath}?token=${token}`,
                            token
                          )
                        }
                      >
                        {copied === token ? (
                          <Check className="size-3" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ナビゲーション */}
      <div className="flex gap-3">
        <Button asChild>
          <a
            href={`/admin/${createdEvent.id}?token=${createdEvent.adminToken}`}
          >
            {t("wizard.goToAdmin")}
          </a>
        </Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          {t("wizard.backToTop")}
        </Button>
      </div>
    </div>
  );
}
