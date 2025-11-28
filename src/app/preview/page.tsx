"use client";

import { useState, useEffect } from "react";
import { SquareCostVisualizer } from "@/components/features/square-cost-visualizer";
import { Minus, Plus, Check, Sparkles, ArrowRight, Vote, Users, BarChart3 } from "lucide-react";

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
  softMeadow: {
    name: "Soft Meadow",
    description: "Forest Earthをより淡く柔らかくしたテーマ",
    colors: {
      primary: "#86EFAC",
      primaryForeground: "#166534",
      secondary: "#F0FDF4",
      background: "#FEFFFE",
      foreground: "#374151",
      muted: "#F3F4F6",
      mutedForeground: "#9CA3AF",
      accent: "#BEF264",
      card: "#FFFFFF",
      border: "#E5E7EB",
    },
  },
  mintBreeze: {
    name: "Mint Breeze",
    description: "ミントグリーンの爽やかな淡いテーマ",
    colors: {
      primary: "#6EE7B7",
      primaryForeground: "#065F46",
      secondary: "#ECFDF5",
      background: "#F9FEFB",
      foreground: "#4B5563",
      muted: "#F0FDF4",
      mutedForeground: "#9CA3AF",
      accent: "#A7F3D0",
      card: "#FFFFFF",
      border: "#D1FAE5",
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
  lavenderDream: {
    name: "Lavender Dream",
    description: "ラベンダー×グレー×白のフェミニンなテーマ",
    colors: {
      primary: "#C4B5FD",
      primaryForeground: "#4C1D95",
      secondary: "#F5F3FF",
      background: "#FAFAFC",
      foreground: "#6B7280",
      muted: "#F3F4F6",
      mutedForeground: "#9CA3AF",
      accent: "#DDD6FE",
      card: "#FFFFFF",
      border: "#E9E5F5",
    },
  },
  blushPink: {
    name: "Blush Pink",
    description: "ピンク×グレー×白の甘く柔らかいテーマ",
    colors: {
      primary: "#F9A8D4",
      primaryForeground: "#831843",
      secondary: "#FDF2F8",
      background: "#FFFBFC",
      foreground: "#6B7280",
      muted: "#F9FAFB",
      mutedForeground: "#9CA3AF",
      accent: "#FBCFE8",
      card: "#FFFFFF",
      border: "#FCE7F3",
    },
  },
  softPeach: {
    name: "Soft Peach",
    description: "ピーチ×グレー×白の温かみのあるかわいいテーマ",
    colors: {
      primary: "#FDBA74",
      primaryForeground: "#7C2D12",
      secondary: "#FFF7ED",
      background: "#FFFCFA",
      foreground: "#6B7280",
      muted: "#F9FAFB",
      mutedForeground: "#9CA3AF",
      accent: "#FED7AA",
      card: "#FFFFFF",
      border: "#FFEDD5",
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
    fontUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap",
  },
  boldStatement: {
    name: "Bold Statement",
    description: "力強い印象を与えるヘビーウェイト",
    heading: "'M PLUS Rounded 1c', sans-serif",
    body: "'M PLUS Rounded 1c', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700&display=swap",
  },
  elegantSerif: {
    name: "Elegant Serif",
    description: "品格と伝統を感じさせる明朝体",
    heading: "'Shippori Mincho', serif",
    body: "'Noto Sans JP', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;700&family=Noto+Sans+JP:wght@400;500&display=swap",
  },
  techForward: {
    name: "Tech Forward",
    description: "テック感のあるモノスペース風",
    heading: "'IBM Plex Sans JP', sans-serif",
    body: "'IBM Plex Sans JP', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;500;700&display=swap",
  },
  zenMaru: {
    name: "Zen Maru",
    description: "親しみやすい丸ゴシック",
    heading: "'Zen Maru Gothic', sans-serif",
    body: "'Zen Maru Gothic', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap",
  },
  kosugi: {
    name: "Kosugi Maru",
    description: "かわいらしい印象の丸ゴシック",
    heading: "'Kosugi Maru', sans-serif",
    body: "'Kosugi Maru', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap",
  },
};

// 文字間オプション
const letterSpacingOptions = {
  tight: {
    name: "タイト",
    description: "詰め気味（-0.025em）",
    value: "-0.025em",
  },
  normal: {
    name: "標準",
    description: "通常の文字間（0）",
    value: "0",
  },
  relaxed: {
    name: "ゆったり",
    description: "少し広め（0.05em）",
    value: "0.05em",
  },
  wide: {
    name: "広め",
    description: "読みやすい広さ（0.1em）",
    value: "0.1em",
  },
};

type PaletteKey = keyof typeof colorPalettes;
type TypographyKey = keyof typeof typographyOptions;
type LetterSpacingKey = keyof typeof letterSpacingOptions;

export default function ThemePreviewPage() {
  const [selectedPalette, setSelectedPalette] = useState<PaletteKey>("midnightGold");
  const [selectedTypography, setSelectedTypography] = useState<TypographyKey>("classicModern");
  const [selectedLetterSpacing, setSelectedLetterSpacing] = useState<LetterSpacingKey>("normal");
  const [demoVotes, setDemoVotes] = useState(3);
  const [mounted, setMounted] = useState(false);

  const palette = colorPalettes[selectedPalette];
  const typography = typographyOptions[selectedTypography];
  const letterSpacing = letterSpacingOptions[selectedLetterSpacing];

  // フォントの動的読み込み（ハイドレーション対応）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration pattern
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // 既存のフォントリンクを削除
    const existingLinks = document.querySelectorAll('link[data-theme-font]');
    existingLinks.forEach(link => link.remove());

    // 新しいフォントリンクを追加
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = typography.fontUrl;
    link.setAttribute('data-theme-font', 'true');
    document.head.appendChild(link);
  }, [selectedTypography, typography.fontUrl, mounted]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">テーマプレビュー</h1>

      {/* コントロールパネル */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* カラーパレット選択 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">カラーパレット</h2>
          <div className="space-y-2">
            {Object.entries(colorPalettes).map(([key, pal]) => (
              <button
                key={key}
                onClick={() => setSelectedPalette(key as PaletteKey)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedPalette === key
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex gap-1">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: pal.colors.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: pal.colors.background }}
                  />
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: pal.colors.accent }}
                  />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium">{pal.name}</div>
                  <div className="text-xs text-gray-500">{pal.description}</div>
                </div>
                {selectedPalette === key && <Check className="w-5 h-5 text-blue-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* タイポグラフィ選択 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">タイポグラフィ</h2>
          <div className="space-y-2">
            {Object.entries(typographyOptions).map(([key, typo]) => (
              <button
                key={key}
                onClick={() => setSelectedTypography(key as TypographyKey)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedTypography === key
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div
                  className="text-lg font-bold min-w-[60px]"
                  style={{ fontFamily: typo.heading }}
                >
                  Aa あ
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium">{typo.name}</div>
                  <div className="text-xs text-gray-500">{typo.description}</div>
                </div>
                {selectedTypography === key && <Check className="w-5 h-5 text-blue-500" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 文字間選択 */}
      <div className="border rounded-lg p-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">文字間（Letter Spacing）</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(letterSpacingOptions).map(([key, ls]) => (
            <button
              key={key}
              onClick={() => setSelectedLetterSpacing(key as LetterSpacingKey)}
              className={`p-4 rounded-lg border transition-all text-center ${
                selectedLetterSpacing === key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div
                className="text-lg font-bold mb-1"
                style={{ letterSpacing: ls.value }}
              >
                公平な意思決定
              </div>
              <div className="text-sm font-medium">{ls.name}</div>
              <div className="text-xs text-gray-500">{ls.description}</div>
              {selectedLetterSpacing === key && <Check className="w-4 h-4 text-blue-500 mx-auto mt-2" />}
            </button>
          ))}
        </div>
      </div>

      {/* プレビューエリア */}
      <div
        className="rounded-xl overflow-hidden border-2"
        style={{
          backgroundColor: palette.colors.background,
          borderColor: palette.colors.border,
        }}
      >
        {/* ホームページ ヒーローセクション プレビュー */}
        <div
          className="relative overflow-hidden py-16 px-4"
          style={{ backgroundColor: palette.colors.background }}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute -top-10 -left-10 w-40 h-40 rotate-45 border opacity-20"
              style={{ borderColor: palette.colors.primary }}
            />
            <div 
              className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full border opacity-10"
              style={{ borderColor: palette.colors.primary }}
            />
            <div 
              className="absolute bottom-1/4 left-1/3 w-20 h-20 rounded-full opacity-5"
              style={{ backgroundColor: palette.colors.primary }}
            />
          </div>

          <div className="relative text-center max-w-xl mx-auto">
            {/* Badge */}
            <div 
              className="mb-6 inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-semibold"
              style={{
                borderColor: palette.colors.primary,
                backgroundColor: `${palette.colors.primary}15`,
                color: palette.colors.foreground,
                fontFamily: typography.body,
                letterSpacing: letterSpacing.value,
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: palette.colors.primary }} />
              <span>次世代の意思決定ツール</span>
            </div>
            
            {/* Hero Title */}
            <h1
              className="mb-4 text-3xl font-black sm:text-4xl"
              style={{
                color: palette.colors.foreground,
                fontFamily: typography.heading,
                letterSpacing: letterSpacing.value,
              }}
            >
              <span className="block">公平な意思決定を</span>
              <span
                className="block"
                style={{ color: palette.colors.primary }}
              >
                シンプルに
              </span>
            </h1>
            
            {/* Description */}
            <p
              className="mx-auto mb-8 max-w-md text-sm"
              style={{
                color: palette.colors.mutedForeground,
                fontFamily: typography.body,
                letterSpacing: letterSpacing.value,
              }}
            >
              二次投票メカニズムで、少数派の強い意見も反映される民主的な投票システム
            </p>
            
            {/* CTA Button */}
            <button
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
              style={{
                backgroundColor: palette.colors.primary,
                color: palette.colors.primaryForeground,
                fontFamily: typography.body,
              }}
            >
              <Plus className="w-4 h-4" />
              イベントを作成
              <ArrowRight className="w-4 h-4" />
            </button>
            
            {/* Formula */}
            <div
              className="mt-8 inline-flex items-center gap-3 rounded-xl border px-4 py-2 font-mono text-xs"
              style={{
                backgroundColor: `${palette.colors.card}80`,
                borderColor: palette.colors.border,
                color: palette.colors.mutedForeground,
              }}
            >
              <span>cost</span>
              <span className="text-base">=</span>
              <span>votes</span>
              <span className="text-lg font-bold" style={{ color: palette.colors.primary }}>²</span>
            </div>
          </div>
        </div>

        {/* 特徴セクション プレビュー */}
        <div
          className="py-8 px-4 border-t"
          style={{
            backgroundColor: `${palette.colors.muted}30`,
            borderColor: palette.colors.border,
          }}
        >
          <h2
            className="text-lg font-bold text-center mb-6"
            style={{
              color: palette.colors.foreground,
              fontFamily: typography.heading,
              letterSpacing: letterSpacing.value,
            }}
          >
            主な特徴
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Vote, title: "二次投票", desc: "強い意見を表明" },
              { icon: Users, title: "簡単認証", desc: "LINE/Google対応" },
              { icon: BarChart3, title: "リアルタイム", desc: "即時結果表示" },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border text-center"
                style={{
                  backgroundColor: palette.colors.card,
                  borderColor: palette.colors.border,
                }}
              >
                <div
                  className="mx-auto mb-2 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${palette.colors.primary}15` }}
                >
                  <feature.icon className="w-5 h-5" style={{ color: palette.colors.primary }} />
                </div>
                <h3
                  className="text-xs font-semibold mb-1"
                  style={{ color: palette.colors.foreground, fontFamily: typography.heading, letterSpacing: letterSpacing.value }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-xs"
                  style={{ color: palette.colors.mutedForeground, fontFamily: typography.body, letterSpacing: letterSpacing.value }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ヘッダー（ナビゲーション風） */}
        <div
          className="p-4 border-t"
          style={{
            backgroundColor: palette.colors.card,
            borderColor: palette.colors.border,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{
                  backgroundColor: palette.colors.primary,
                  color: palette.colors.primaryForeground,
                }}
              >
                Q
              </div>
              <span
                className="font-bold"
                style={{
                  color: palette.colors.foreground,
                  fontFamily: typography.heading,
                }}
              >
                QV-Tool
              </span>
            </div>
            <div className="flex gap-2">
              <div
                className="px-3 py-1 rounded-full text-xs"
                style={{
                  backgroundColor: palette.colors.muted,
                  color: palette.colors.mutedForeground,
                }}
              >
                JP
              </div>
            </div>
          </div>
        </div>

        {/* コンテンツプレビュー */}
        <div className="p-6 space-y-6">
          {/* カード例 */}
          <div
            className="rounded-lg p-4 border"
            style={{
              backgroundColor: palette.colors.card,
              borderColor: palette.colors.border,
            }}
          >
            <h3
              className="text-lg font-semibold mb-2"
              style={{
                color: palette.colors.foreground,
                fontFamily: typography.heading,
                letterSpacing: letterSpacing.value,
              }}
            >
              イベントタイトル
            </h3>
            <p
              className="text-sm mb-4"
              style={{
                color: palette.colors.mutedForeground,
                fontFamily: typography.body,
                letterSpacing: letterSpacing.value,
              }}
            >
              これはイベントの説明文です。二次投票を使って、参加者の多様な意見を反映した結果を得ることができます。
            </p>
            <div className="flex gap-2">
              <span
                className="px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: palette.colors.muted,
                  color: palette.colors.mutedForeground,
                }}
              >
                進行中
              </span>
              <span
                className="px-2 py-1 rounded text-xs"
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
            className="rounded-lg p-4 border"
            style={{
              backgroundColor: palette.colors.card,
              borderColor: palette.colors.border,
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{
                color: palette.colors.foreground,
                fontFamily: typography.heading,
                letterSpacing: letterSpacing.value,
              }}
            >
              投票コントロール
            </h3>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDemoVotes(Math.max(0, demoVotes - 1))}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: palette.colors.muted,
                  color: palette.colors.foreground,
                }}
              >
                <Minus className="w-6 h-6" />
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
                className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: palette.colors.primary,
                  color: palette.colors.primaryForeground,
                }}
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            
            <div
              className="text-center mt-2 text-sm"
              style={{ color: palette.colors.mutedForeground }}
            >
              {demoVotes}票 = {demoVotes * demoVotes}コスト
            </div>
          </div>

          {/* ボタン例 */}
          <div className="flex flex-wrap gap-3">
            <button
              className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: palette.colors.primary,
                color: palette.colors.primaryForeground,
                fontFamily: typography.body,
                letterSpacing: letterSpacing.value,
              }}
            >
              プライマリボタン
            </button>
            <button
              className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: palette.colors.secondary,
                color: palette.colors.foreground,
                fontFamily: typography.body,
                letterSpacing: letterSpacing.value,
              }}
            >
              セカンダリボタン
            </button>
            <button
              className="px-4 py-2 rounded-lg font-medium border transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "transparent",
                color: palette.colors.foreground,
                borderColor: palette.colors.border,
                fontFamily: typography.body,
                letterSpacing: letterSpacing.value,
              }}
            >
              アウトラインボタン
            </button>
          </div>

          {/* プログレスバー例 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm" style={{ color: palette.colors.mutedForeground }}>
              <span>残りクレジット</span>
              <span>75 / 100</span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
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
      <div className="mt-8 p-4 rounded-lg bg-gray-100">
        <h3 className="font-semibold mb-2">選択中のテーマ</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">カラーパレット: </span>
            <span className="font-medium">{palette.name}</span>
          </div>
          <div>
            <span className="text-gray-500">タイポグラフィ: </span>
            <span className="font-medium">{typography.name}</span>
          </div>
          <div>
            <span className="text-gray-500">文字間: </span>
            <span className="font-medium">{letterSpacing.name}</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white rounded border text-xs font-mono overflow-x-auto">
          <pre>{JSON.stringify({ palette: selectedPalette, typography: selectedTypography, letterSpacing: selectedLetterSpacing }, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

