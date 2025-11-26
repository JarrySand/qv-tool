import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Vote, BarChart3, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary bg-secondary/20 px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <span className="size-2 rounded-full bg-secondary animate-pulse" />
            Quadratic Voting
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            より公平な意思決定を
            <span className="block text-secondary">二次投票で実現</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            Quadratic Voting（二次投票）は、各選択肢への投票コストが票数の2乗になる仕組みです。
            強い選好を持つ人々の意見を反映しつつ、多様な意見のバランスを取ることができます。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="h-12 px-8" asChild>
              <Link href="/admin/create">
                <Plus className="size-5" />
                イベントを作成
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">QV-Toolの特徴</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Vote className="mb-2 size-10 text-secondary" />
              <CardTitle>二次投票メカニズム</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                1票=1クレジット、2票=4クレジット、3票=9クレジット...
                重要な選択肢に多くの票を投じることができますが、そのコストは急激に増加します。
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="mb-2 size-10 text-secondary" />
              <CardTitle>柔軟な認証方式</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                個別URL方式、Googleアカウント、LINEアカウントから選択可能。
                用途に合わせた認証方式でスムーズな投票を実現します。
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="mb-2 size-10 text-secondary" />
              <CardTitle>リアルタイム結果</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                投票結果はリアルタイムで集計・表示。
                グラフで視覚的に結果を確認でき、CSVでのエクスポートも可能です。
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">使い方</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              1
            </div>
            <h3 className="mb-2 text-xl font-semibold">イベントを作成</h3>
            <p className="text-muted-foreground">
              タイトル、期間、認証方式を設定してイベントを作成します。アカウント登録は不要です。
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              2
            </div>
            <h3 className="mb-2 text-xl font-semibold">選択肢を追加</h3>
            <p className="text-muted-foreground">
              投票対象となる選択肢を追加します。画像やリンクも設定可能です。
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              3
            </div>
            <h3 className="mb-2 text-xl font-semibold">投票を開始</h3>
            <p className="text-muted-foreground">
              イベントURLを共有して投票を開始。結果はリアルタイムで確認できます。
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>QV-Tool - Quadratic Voting Tool</p>
          <p className="mt-1">
            オープンソースプロジェクト |{" "}
            <a
              href="https://github.com"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
