"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Download,
  Copy,
  Check,
  Loader2,
  CheckCircle,
  Circle,
} from "lucide-react";
import { generateAccessTokens } from "@/lib/actions/access-token";

type AccessToken = {
  id: string;
  token: string;
  isUsed: boolean;
  createdAt: Date;
};

type Props = {
  tokens: AccessToken[];
  eventId: string;
  adminToken: string;
};

export function AccessTokenManager({
  tokens: initialTokens,
  eventId,
  adminToken,
}: Props) {
  const [tokens, setTokens] = useState(initialTokens);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generateCount, setGenerateCount] = useState(10);

  const usedCount = tokens.filter((t) => t.isUsed).length;
  const unusedCount = tokens.length - usedCount;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleGenerate = async () => {
    setError(null);
    startTransition(async () => {
      const result = await generateAccessTokens(
        eventId,
        adminToken,
        generateCount
      );
      if (result.success) {
        setTokens((prev) => [...result.tokens, ...prev]);
      } else {
        setError(result.error);
      }
    });
  };

  const handleCopy = async (token: string, id: string) => {
    const url = `${baseUrl}/events/${eventId}/vote?token=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleExportCSV = () => {
    const headers = ["トークン", "URL", "使用済み", "作成日時"];
    const rows = tokens.map((t) => [
      t.token,
      `${baseUrl}/events/${eventId}/vote?token=${t.token}`,
      t.isUsed ? "はい" : "いいえ",
      new Date(t.createdAt).toLocaleString("ja-JP"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voting-tokens-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
          {error}
        </div>
      )}

      {/* 統計 */}
      <div className="bg-muted/50 grid grid-cols-3 gap-4 rounded-lg p-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{tokens.length}</p>
          <p className="text-muted-foreground text-sm">総トークン数</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{usedCount}</p>
          <p className="text-muted-foreground text-sm">使用済み</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{unusedCount}</p>
          <p className="text-muted-foreground text-sm">未使用</p>
        </div>
      </div>

      {/* アクション */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="generate-count">生成数</Label>
          <div className="flex gap-2">
            <Input
              id="generate-count"
              type="number"
              min={1}
              max={100}
              value={generateCount}
              onChange={(e) => setGenerateCount(parseInt(e.target.value) || 10)}
              className="w-24"
            />
            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              トークン生成
            </Button>
          </div>
        </div>

        {tokens.length > 0 && (
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="size-4" />
            CSVエクスポート
          </Button>
        )}
      </div>

      {/* トークン一覧 */}
      {tokens.length > 0 && (
        <div className="max-h-96 divide-y overflow-y-auto rounded-lg border">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="hover:bg-muted/50 flex items-center gap-3 p-3 text-sm"
            >
              {token.isUsed ? (
                <CheckCircle className="size-4 shrink-0 text-green-600" />
              ) : (
                <Circle className="text-muted-foreground size-4 shrink-0" />
              )}
              <code className="flex-1 truncate font-mono text-xs">
                {token.token}
              </code>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleCopy(token.token, token.id)}
              >
                {copiedId === token.id ? (
                  <Check className="size-4 text-green-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {tokens.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          <p>まだトークンが生成されていません</p>
          <p className="text-sm">上のボタンからトークンを生成してください</p>
        </div>
      )}
    </div>
  );
}
