"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuadraticExplainerProps {
  locale?: "ja" | "en";
}

export function QuadraticExplainer({ locale = "ja" }: QuadraticExplainerProps) {
  const [demoVotes, setDemoVotes] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState<"up" | "down">("up");

  // 自動デモ: 1→2→3→4→5→4→3→2→1 とループ
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setDemoVotes((prev) => {
        if (direction === "up") {
          if (prev >= 5) {
            setDirection("down");
            return prev - 1;
          }
          return prev + 1;
        } else {
          if (prev <= 1) {
            setDirection("up");
            return prev + 1;
          }
          return prev - 1;
        }
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, direction]);

  const cost = demoVotes * demoVotes;

  const texts = {
    ja: {
      title: "なぜ「二乗」なのか？",
      normalVoting: "通常の投票",
      quadraticVoting: "二次投票",
      cost: "コスト",
      description: "二乗コストにより、",
      benefit1: "極端な投票を抑制",
      benefit2: "多様な意見を反映",
      example: "例: 100クレジットで",
      exampleNormal: "→ 100票を1つに集中",
      exampleQv: "→ 10票ずつ10個に分散も可能",
    },
    en: {
      title: 'Why "Quadratic"?',
      normalVoting: "Normal Voting",
      quadraticVoting: "Quadratic Voting",
      cost: "cost",
      description: "Quadratic cost leads to",
      benefit1: "prevents extreme voting",
      benefit2: "reflects diverse opinions",
      example: "Example: With 100 credits",
      exampleNormal: "→ 100 votes on one option",
      exampleQv: "→ or 10 votes on 10 options",
    },
  };

  const t = texts[locale];

  return (
    <Card className="border-primary/20 overflow-hidden border-2">
      <CardContent className="p-6">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold">{t.title}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="size-8"
            >
              {isPlaying ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setDemoVotes(1);
                setDirection("up");
              }}
              className="size-8"
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </div>

        {/* 比較表示 */}
        <div className="mb-6 flex items-end justify-center gap-8">
          {/* 通常投票 */}
          <div className="text-center">
            <p className="text-muted-foreground mb-3 text-sm">
              {t.normalVoting}
            </p>
            <div className="mb-2 flex h-20 items-end justify-center gap-1">
              {Array.from({ length: demoVotes }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted-foreground/30 h-5 w-5 rounded transition-all duration-300"
                />
              ))}
            </div>
            <p className="text-lg font-bold">
              {demoVotes} {t.cost}
            </p>
          </div>

          <div className="text-muted-foreground pb-8 text-2xl">vs</div>

          {/* 二次投票 */}
          <div className="text-center">
            <p className="text-primary mb-3 text-sm font-medium">
              {t.quadraticVoting}
            </p>
            <div className="mb-2 flex h-20 items-end justify-center">
              <div
                className="grid gap-0.5 transition-all duration-300"
                style={{
                  gridTemplateColumns: `repeat(${demoVotes}, 1fr)`,
                }}
              >
                {Array.from({ length: cost }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "bg-primary h-4 w-4 rounded-sm transition-all duration-200",
                      "animate-in fade-in zoom-in-50"
                    )}
                    style={{
                      animationDelay: `${i * 30}ms`,
                      animationFillMode: "backwards",
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="text-primary text-lg font-bold">
              {demoVotes}×{demoVotes} = {cost} {t.cost}
            </p>
          </div>
        </div>

        {/* 手動コントロール */}
        <div className="mb-6 flex justify-center gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => {
                setDemoVotes(n);
                setIsPlaying(false);
              }}
              className={cn(
                "h-10 w-10 rounded-full font-bold transition-all",
                demoVotes === n
                  ? "bg-primary text-primary-foreground scale-110"
                  : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        {/* 説明 */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-muted-foreground text-sm">
            {t.description}
            <strong className="text-foreground">{t.benefit1}</strong>
            {locale === "ja" ? "し、" : " and "}
            <strong className="text-foreground">{t.benefit2}</strong>
            {locale === "ja" ? "できます" : ""}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {t.example}
            <br />
            {t.exampleNormal}
            <br />
            {t.exampleQv}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
