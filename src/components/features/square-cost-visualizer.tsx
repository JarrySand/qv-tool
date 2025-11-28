"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface SquareCostVisualizerProps {
  votes: number;
  maxDisplayVotes?: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  showLabel?: boolean;
  fixedSize?: boolean; // 固定サイズコンテナを使用するか
  primaryColor?: string; // ブロックの色（カスタムテーマ用）
  backgroundColor?: string; // 背景色（0票時の枠線用）
  className?: string;
}

const sizeConfig = {
  sm: { blockSize: 8, gap: 1 },
  md: { blockSize: 12, gap: 1 },
  lg: { blockSize: 16, gap: 2 },
};

export function SquareCostVisualizer({
  votes,
  maxDisplayVotes = 10,
  size = "md",
  animated = false,
  showLabel = true,
  fixedSize = true,
  primaryColor,
  backgroundColor,
  className,
}: SquareCostVisualizerProps) {
  const config = sizeConfig[size];
  const cost = votes * votes;
  
  // 表示する票数（大きすぎる場合は制限）
  const displayVotes = Math.min(votes, maxDisplayVotes);
  const displayCost = displayVotes * displayVotes;
  const isOverflow = votes > maxDisplayVotes;

  // 固定コンテナのサイズ（最大表示時のサイズ）
  const containerSize = fixedSize 
    ? maxDisplayVotes * config.blockSize + (maxDisplayVotes - 1) * config.gap 
    : displayVotes * config.blockSize + Math.max(0, displayVotes - 1) * config.gap;

  // ブロックの配列を生成
  const blocks = useMemo(() => {
    return Array.from({ length: displayCost }, (_, i) => i);
  }, [displayCost]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* 固定サイズコンテナ */}
      <div 
        className="flex items-center justify-center"
        style={{
          width: containerSize,
          height: containerSize,
          minWidth: containerSize,
          minHeight: containerSize,
        }}
      >
        {votes === 0 ? (
          <div 
            className={cn(
              "rounded border-2 border-dashed",
              !backgroundColor && "border-muted-foreground/30"
            )}
            style={{
              width: config.blockSize,
              height: config.blockSize,
              borderColor: backgroundColor ? `${backgroundColor}80` : undefined,
            }}
          />
        ) : (
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${displayVotes}, 1fr)`,
              gap: config.gap,
            }}
          >
            {blocks.map((index) => (
              <div
                key={index}
                className={cn(
                  "rounded-sm",
                  !primaryColor && "bg-secondary",
                  animated && "animate-in zoom-in-50 duration-200"
                )}
                style={{
                  width: config.blockSize,
                  height: config.blockSize,
                  backgroundColor: primaryColor || undefined,
                  animationDelay: animated ? `${index * 15}ms` : undefined,
                  animationFillMode: "backwards",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ラベル */}
      {showLabel && (
        <div className="mt-1 text-center text-xs">
          <span className="font-bold">{votes}</span>
          <span className="text-muted-foreground">×</span>
          <span className="font-bold">{votes}</span>
          <span className="text-muted-foreground">=</span>
          <span 
            className={cn("font-black", !primaryColor && "text-secondary")}
            style={{ color: primaryColor || undefined }}
          >
            {cost}
          </span>
          {isOverflow && (
            <span className="ml-1 text-muted-foreground">
              ({maxDisplayVotes}まで表示)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
