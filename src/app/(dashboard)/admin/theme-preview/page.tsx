"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SquareCostVisualizer } from "@/components/features/square-cost-visualizer";
import { Minus, Plus, Check } from "lucide-react";

// カラーパレット定義
const colorPalettes = {
  midnightGold: {
    name: "Midnight Gold",
    description: "高級感と信頼性を演出するダークテーマ",
    colors: {
      primary: "#D4AF37",
      primaryForeground: "#1A1A2E",
      secondary: "#2D2D44",
      background: "#1A1A2E",
      foreground: "#E8E8E8",
      muted: "#2D2D44",
      mutedForeground: "#A0A0A0",
      accent: "#D4AF37",
      card: "#232338",
      border: "#3D3D5C",
    },
  },
  oceanHorizon: {
    name: "Ocean Horizon",
    description: "清潔感と開放感のあるブルーテーマ",
    colors: {
      primary: "#0EA5E9",
      primaryForeground: "#FFFFFF",
      secondary: "#E0F2FE",
      background: "#F8FAFC",
      foreground: "#0F172A",
      muted: "#E2E8F0",
      mutedForeground: "#64748B",
      accent: "#06B6D4",
      card: "#FFFFFF",
      border: "#CBD5E1",
    },
  },
  digitalSakura: {
    name: "Digital Sakura",
    description: "日本的な美意識を現代風に解釈",
    colors: {
      primary: "#EC4899",
      primaryForeground: "#FFFFFF",
      secondary: "#FCE7F3",
      background: "#FFFBFE",
      foreground: "#1F1F1F",
      muted: "#F3E8FF",
      mutedForeground: "#6B7280",
      accent: "#A855F7",
      card: "#FFFFFF",
      border: "#F9A8D4",
    },
  },
  neonCyber: {
    name: "Neon Cyber",
    description: "未来的で革新的なサイバーパンクテーマ",
    colors: {
      primary: "#00FF88",
      primaryForeground: "#0D0D0D",
      secondary: "#1A1A2E",
      background: "#0D0D0D",
      foreground: "#E0E0E0",
      muted: "#1A1A2E",
      mutedForeground: "#888888",
      accent: "#00D4FF",
      card: "#141428",
      border: "#2D2D5C",
    },
  },
  forestEarth: {
    name: "Forest Earth",
    description: "自然と調和したアースカラーテーマ",
    colors: {
      primary: "#22C55E",
      primaryForeground: "#FFFFFF",
      secondary: "#ECFDF5",
      background: "#FAFAF9",
      foreground: "#1C1917",
      muted: "#E7E5E4",
      mutedForeground: "#78716C",
      accent: "#84CC16",
      card: "#FFFFFF",
      border: "#D6D3D1",
    },
  },
  sunsetWarm: {
    name: "Sunset Warm",
    description: "温かみのあるオレンジ系グラデーション",
    colors: {
      primary: "#F97316",
      primaryForeground: "#FFFFFF",
      secondary: "#FFF7ED",
      background: "#FFFBF5",
      foreground: "#1C1917",
      muted: "#FED7AA",
      mutedForeground: "#9A3412",
      accent: "#EAB308",
      card: "#FFFFFF",
      border: "#FDBA74",
    },
  },
};

// タイポグラフィ定義
const typographyOptions = {
  classicModern: {
    name: "Classic Modern",
    description: "読みやすさを重視したモダンな組み合わせ",
    heading: "'Noto Sans JP', sans-serif",
    body: "'Noto Sans JP', sans-serif",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap",
  },
  boldStatement: {
    name: "Bold Statement",
    description: "力強い印象を与えるヘビーウェイト",
    heading: "'M PLUS Rounded 1c', sans-serif",
    body: "'M PLUS Rounded 1c', sans-serif",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700&display=swap",
  },
  elegantSerif: {
    name: "Elegant Serif",
    description: "品格と伝統を感じさせる明朝体",
    heading: "'Shippori Mincho', serif",
    body: "'Noto Sans JP', sans-serif",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;700&family=Noto+Sans+JP:wght@400;500&display=swap",
  },
  techForward: {
    name: "Tech Forward",
    description: "テック感のあるモノスペース風",
    heading: "'IBM Plex Sans JP', sans-serif",
    body: "'IBM Plex Sans JP', sans-serif",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;500;700&display=swap",
  },
  zenMaru: {
    name: "Zen Maru",
    description: "親しみやすい丸ゴシック",
    heading: "'Zen Maru Gothic', sans-serif",
    body: "'Zen Maru Gothic', sans-serif",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap",
  },
  kosugi: {
    name: "Kosugi Maru",
    description: "かわいらしい印象の丸ゴシック",
    heading: "'Kosugi Maru', sans-serif",
    body: "'Kosugi Maru', sans-serif",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap",
  },
};

type PaletteKey = keyof typeof colorPalettes;
type TypographyKey = keyof typeof typographyOptions;

export default function ThemePreviewPage() {
  const [selectedPalette, setSelectedPalette] =
    useState<PaletteKey>("midnightGold");
  const [selectedTypography, setSelectedTypography] =
    useState<TypographyKey>("classicModern");
  const [demoVotes, setDemoVotes] = useState(3);
  const [mounted, setMounted] = useState(false);

  const palette = colorPalettes[selectedPalette];
  const typography = typographyOptions[selectedTypography];

  // フォントの動的読み込み（ハイドレーション対応）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration pattern
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // 既存のフォントリンクを削除
    const existingLinks = document.querySelectorAll("link[data-theme-font]");
    existingLinks.forEach((link) => link.remove());

    // 新しいフォントリンクを追加
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = typography.fontUrl;
    link.setAttribute("data-theme-font", "true");
    document.head.appendChild(link);
  }, [selectedTypography, typography.fontUrl, mounted]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const previewStyle = {
    "--preview-primary": palette.colors.primary,
    "--preview-primary-foreground": palette.colors.primaryForeground,
    "--preview-secondary": palette.colors.secondary,
    "--preview-background": palette.colors.background,
    "--preview-foreground": palette.colors.foreground,
    "--preview-muted": palette.colors.muted,
    "--preview-muted-foreground": palette.colors.mutedForeground,
    "--preview-accent": palette.colors.accent,
    "--preview-card": palette.colors.card,
    "--preview-border": palette.colors.border,
    fontFamily: typography.body,
  } as React.CSSProperties;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">テーマプレビュー</h1>

      {/* コントロールパネル */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* カラーパレット選択 */}
        <Card>
          <CardHeader>
            <CardTitle>カラーパレット</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(colorPalettes).map(([key, pal]) => (
              <button
                key={key}
                onClick={() => setSelectedPalette(key as PaletteKey)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 transition-all ${
                  selectedPalette === key
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex gap-1">
                  <div
                    className="h-6 w-6 rounded"
                    style={{ backgroundColor: pal.colors.primary }}
                  />
                  <div
                    className="h-6 w-6 rounded"
                    style={{ backgroundColor: pal.colors.background }}
                  />
                  <div
                    className="h-6 w-6 rounded"
                    style={{ backgroundColor: pal.colors.accent }}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{pal.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {pal.description}
                  </div>
                </div>
                {selectedPalette === key && (
                  <Check className="text-primary h-5 w-5" />
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* タイポグラフィ選択 */}
        <Card>
          <CardHeader>
            <CardTitle>タイポグラフィ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(typographyOptions).map(([key, typo]) => (
              <button
                key={key}
                onClick={() => setSelectedTypography(key as TypographyKey)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 transition-all ${
                  selectedTypography === key
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div
                  className="min-w-[60px] text-lg font-bold"
                  style={{ fontFamily: typo.heading }}
                >
                  Aa あ
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{typo.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {typo.description}
                  </div>
                </div>
                {selectedTypography === key && (
                  <Check className="text-primary h-5 w-5" />
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* プレビューエリア */}
      <div
        className="overflow-hidden rounded-xl border-2"
        style={{
          ...previewStyle,
          backgroundColor: palette.colors.background,
          borderColor: palette.colors.border,
        }}
      >
        {/* ヘッダープレビュー */}
        <div
          className="border-b p-4"
          style={{
            backgroundColor: palette.colors.card,
            borderColor: palette.colors.border,
          }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-xl font-bold"
              style={{
                color: palette.colors.foreground,
                fontFamily: typography.heading,
              }}
            >
              二次投票ツール
            </h2>
            <div className="flex gap-2">
              <div
                className="rounded-full px-3 py-1 text-sm"
                style={{
                  backgroundColor: palette.colors.primary,
                  color: palette.colors.primaryForeground,
                }}
              >
                投票中
              </div>
            </div>
          </div>
        </div>

        {/* コンテンツプレビュー */}
        <div className="space-y-6 p-6">
          {/* カード例 */}
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: palette.colors.card,
              borderColor: palette.colors.border,
            }}
          >
            <h3
              className="mb-2 text-lg font-semibold"
              style={{
                color: palette.colors.foreground,
                fontFamily: typography.heading,
              }}
            >
              イベントタイトル
            </h3>
            <p
              className="mb-4 text-sm"
              style={{
                color: palette.colors.mutedForeground,
                fontFamily: typography.body,
              }}
            >
              これはイベントの説明文です。二次投票を使って、参加者の多様な意見を反映した結果を得ることができます。
            </p>
            <div className="flex gap-2">
              <span
                className="rounded px-2 py-1 text-xs"
                style={{
                  backgroundColor: palette.colors.muted,
                  color: palette.colors.mutedForeground,
                }}
              >
                進行中
              </span>
              <span
                className="rounded px-2 py-1 text-xs"
                style={{
                  backgroundColor: palette.colors.secondary,
                  color: palette.colors.foreground,
                }}
              >
                100クレジット
              </span>
            </div>
          </div>

          {/* 投票コントロールデモ */}
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: palette.colors.card,
              borderColor: palette.colors.border,
            }}
          >
            <h3
              className="mb-4 text-lg font-semibold"
              style={{
                color: palette.colors.foreground,
                fontFamily: typography.heading,
              }}
            >
              投票コントロール
            </h3>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDemoVotes(Math.max(0, demoVotes - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-full transition-colors"
                style={{
                  backgroundColor: palette.colors.muted,
                  color: palette.colors.foreground,
                }}
              >
                <Minus className="h-6 w-6" />
              </button>

              <div className="flex-1">
                <SquareCostVisualizer
                  votes={demoVotes}
                  maxDisplayVotes={10}
                  primaryColor={palette.colors.primary}
                  backgroundColor={palette.colors.muted}
                />
              </div>

              <button
                onClick={() => setDemoVotes(Math.min(10, demoVotes + 1))}
                className="flex h-12 w-12 items-center justify-center rounded-full transition-colors"
                style={{
                  backgroundColor: palette.colors.primary,
                  color: palette.colors.primaryForeground,
                }}
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>

            <div
              className="mt-2 text-center text-sm"
              style={{ color: palette.colors.mutedForeground }}
            >
              {demoVotes}票 = {demoVotes * demoVotes}コスト
            </div>
          </div>

          {/* ボタン例 */}
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-lg px-4 py-2 font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: palette.colors.primary,
                color: palette.colors.primaryForeground,
                fontFamily: typography.body,
              }}
            >
              プライマリボタン
            </button>
            <button
              className="rounded-lg px-4 py-2 font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: palette.colors.secondary,
                color: palette.colors.foreground,
                fontFamily: typography.body,
              }}
            >
              セカンダリボタン
            </button>
            <button
              className="rounded-lg border px-4 py-2 font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "transparent",
                color: palette.colors.foreground,
                borderColor: palette.colors.border,
                fontFamily: typography.body,
              }}
            >
              アウトラインボタン
            </button>
          </div>

          {/* プログレスバー例 */}
          <div className="space-y-2">
            <div
              className="flex justify-between text-sm"
              style={{ color: palette.colors.mutedForeground }}
            >
              <span>残りクレジット</span>
              <span>75 / 100</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ backgroundColor: palette.colors.muted }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: "75%",
                  backgroundColor: palette.colors.primary,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 選択中のテーマ情報 */}
      <div className="bg-muted/50 mt-8 rounded-lg p-4">
        <h3 className="mb-2 font-semibold">選択中のテーマ</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">カラーパレット: </span>
            <span className="font-medium">{palette.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">タイポグラフィ: </span>
            <span className="font-medium">{typography.name}</span>
          </div>
        </div>
        <div className="bg-background mt-4 overflow-x-auto rounded border p-3 font-mono text-xs">
          <pre>
            {JSON.stringify(
              { palette: selectedPalette, typography: selectedTypography },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
