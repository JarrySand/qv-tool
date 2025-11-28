import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Vote,
  BarChart3,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/features/language-switcher";
import { QuadraticExplainer } from "@/components/features/quadratic-explainer";
import type { Locale } from "@/i18n/config";

export default async function Home() {
  const t = await getTranslations("home");
  const locale = (await getLocale()) as Locale;

  return (
    <main id="main-content" className="bg-background min-h-screen">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher currentLocale={locale} />
      </div>

      {/* Hero Section with animated background */}
      <div className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="from-background via-background to-secondary/10 absolute inset-0 bg-gradient-to-br" />

        {/* Animated geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large rotating square */}
          <div
            className="border-primary/20 absolute -top-20 -left-20 size-80 rotate-45 animate-[spin_30s_linear_infinite] border"
            style={{ animationDirection: "reverse" }}
          />
          {/* Floating circles */}
          <div className="border-primary/10 absolute top-1/4 right-1/4 size-64 animate-[pulse_4s_ease-in-out_infinite] rounded-full border" />
          <div className="bg-primary/5 absolute bottom-1/4 left-1/3 size-40 animate-[bounce_6s_ease-in-out_infinite] rounded-full" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,#A78BFA08_50%,transparent_51%,transparent_100%)] bg-[size:4rem_4rem]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,transparent_49%,#A78BFA08_50%,transparent_51%,transparent_100%)] bg-[size:4rem_4rem]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-32 text-center">
          {/* Animated badge */}
          <div
            className="border-primary bg-primary/10 animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-sm font-semibold backdrop-blur-sm"
            style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}
          >
            <Sparkles className="text-primary size-4 animate-[pulse_2s_ease-in-out_infinite]" />
            <span className="text-foreground">{t("badge")}</span>
          </div>

          {/* Hero title with staggered animation */}
          <h1
            className="animate-fade-in mb-6 text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl"
            style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}
          >
            <span className="block">{t("title")}</span>
            <span className="text-primary block">{t("titleHighlight")}</span>
          </h1>

          {/* Description with fade in */}
          <p
            className="text-muted-foreground animate-fade-in mx-auto mb-12 max-w-2xl text-lg md:text-xl"
            style={{ animationDelay: "0.4s", animationFillMode: "backwards" }}
          >
            {t("description")}
          </p>

          {/* CTA Button with hover effect */}
          <div
            className="animate-fade-in flex flex-wrap justify-center gap-4"
            style={{ animationDelay: "0.6s", animationFillMode: "backwards" }}
          >
            <Button
              size="lg"
              className="group h-14 px-8 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(167,139,250,0.4)]"
              asChild
            >
              <Link href="/admin/create">
                <Plus className="size-5 transition-transform group-hover:rotate-90" />
                {t("createEvent")}
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Decorative formula */}
          <div
            className="bg-card/50 animate-fade-in mt-16 inline-flex items-center gap-4 rounded-2xl border px-6 py-4 font-mono text-sm backdrop-blur-sm"
            style={{ animationDelay: "0.8s", animationFillMode: "backwards" }}
          >
            <span className="text-muted-foreground">cost</span>
            <span className="text-xl">=</span>
            <span className="text-muted-foreground">votes</span>
            <span className="text-primary text-2xl font-bold">²</span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/30 relative border-t py-24">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">
            {t("features.title")}
          </h2>
          <p className="text-muted-foreground mx-auto mb-16 max-w-2xl text-center">
            {locale === "ja"
              ? "公平で民主的な意思決定のための最新ツール"
              : "Modern tools for fair and democratic decision making"}
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature Card 1 */}
            <Card className="group hover:border-primary hover:shadow-primary/10 relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg">
              <div className="from-primary/0 to-primary/5 absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative">
                <div className="bg-primary/10 mb-4 inline-flex size-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
                  <Vote className="text-primary size-7" />
                </div>
                <CardTitle className="text-xl">
                  {t("features.qv.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-base leading-relaxed">
                  {t("features.qv.description")}
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature Card 2 */}
            <Card className="group hover:border-primary hover:shadow-primary/10 relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg">
              <div className="from-primary/0 to-primary/5 absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative">
                <div className="bg-primary/10 mb-4 inline-flex size-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
                  <Users className="text-primary size-7" />
                </div>
                <CardTitle className="text-xl">
                  {t("features.auth.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-base leading-relaxed">
                  {t("features.auth.description")}
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature Card 3 */}
            <Card className="group hover:border-primary hover:shadow-primary/10 relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg">
              <div className="from-primary/0 to-primary/5 absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative">
                <div className="bg-primary/10 mb-4 inline-flex size-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
                  <BarChart3 className="text-primary size-7" />
                </div>
                <CardTitle className="text-xl">
                  {t("features.realtime.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-base leading-relaxed">
                  {t("features.realtime.description")}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* QV Explainer Section */}
      <div className="relative py-24">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">
            {locale === "ja"
              ? "二次投票の仕組み"
              : "How Quadratic Voting Works"}
          </h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-lg text-center">
            {locale === "ja"
              ? "インタラクティブなデモで体験してみましょう"
              : "Experience it with an interactive demo"}
          </p>
          <QuadraticExplainer locale={locale} />
        </div>
      </div>

      {/* How it works with timeline */}
      <div className="bg-muted/30 relative py-24">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">
            {t("howItWorks.title")}
          </h2>
          <p className="text-muted-foreground mx-auto mb-16 max-w-2xl text-center">
            {locale === "ja"
              ? "3ステップで簡単に始められます"
              : "Get started in 3 simple steps"}
          </p>

          <div className="relative">
            <div className="grid gap-12 md:grid-cols-3">
              {/* Step 1 */}
              <div className="group relative text-center">
                <div className="relative mx-auto mb-6 flex size-16 items-center justify-center">
                  <div className="bg-primary/20 absolute inset-0 animate-ping rounded-full [animation-duration:3s]" />
                  <div className="border-primary bg-background relative flex size-16 items-center justify-center rounded-full border-4 text-2xl font-black transition-transform group-hover:scale-110">
                    1
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-bold">
                  {t("howItWorks.step1.title")}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t("howItWorks.step1.description")}
                </p>
              </div>

              {/* Step 2 */}
              <div className="group relative text-center">
                <div className="relative mx-auto mb-6 flex size-16 items-center justify-center">
                  <div className="bg-primary/20 absolute inset-0 animate-ping rounded-full [animation-delay:1s] [animation-duration:3s]" />
                  <div className="border-primary bg-background relative flex size-16 items-center justify-center rounded-full border-4 text-2xl font-black transition-transform group-hover:scale-110">
                    2
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-bold">
                  {t("howItWorks.step2.title")}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t("howItWorks.step2.description")}
                </p>
              </div>

              {/* Step 3 */}
              <div className="group relative text-center">
                <div className="relative mx-auto mb-6 flex size-16 items-center justify-center">
                  <div className="bg-primary/20 absolute inset-0 animate-ping rounded-full [animation-delay:2s] [animation-duration:3s]" />
                  <div className="border-primary bg-background relative flex size-16 items-center justify-center rounded-full border-4 text-2xl font-black transition-transform group-hover:scale-110">
                    3
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-bold">
                  {t("howItWorks.step3.title")}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t("howItWorks.step3.description")}
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-16 text-center">
            <Button
              size="lg"
              className="group h-14 px-10 text-lg font-semibold transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link href="/admin/create">
                {t("createEvent")}
                <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/30 border-t py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-xl font-bold">
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg font-black">
                Q
              </div>
              <span>QV-Tool</span>
            </div>
            <p className="text-muted-foreground text-center text-sm">
              {t("footer.projectName")}
            </p>
            <div className="text-muted-foreground flex items-center gap-4 text-sm">
              <span>{t("footer.openSource")}</span>
              <span>•</span>
              <a
                href="https://github.com"
                className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <ArrowRight className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
