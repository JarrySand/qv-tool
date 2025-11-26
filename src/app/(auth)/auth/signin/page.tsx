import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "ログイン | QV-Tool",
  description: "投票するためにログインしてください",
};

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;

  // 既にログイン済みの場合はリダイレクト
  if (session?.user) {
    redirect(params.callbackUrl || "/");
  }

  const callbackUrl = params.callbackUrl || "/";
  const error = params.error;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          トップへ戻る
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">ログイン</CardTitle>
            <CardDescription>
              投票するためにアカウントでログインしてください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive text-center">
                {error === "OAuthAccountNotLinked"
                  ? "このメールアドレスは別の認証方法で登録されています"
                  : "ログインに失敗しました。もう一度お試しください。"}
              </div>
            )}

            {/* Google Sign In */}
            {process.env.GOOGLE_CLIENT_ID && (
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: callbackUrl });
                }}
              >
                <Button type="submit" variant="outline" className="w-full h-12">
                  <svg className="size-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Googleでログイン
                </Button>
              </form>
            )}

            {/* LINE Sign In（将来実装） */}
            {process.env.LINE_CLIENT_ID && (
              <form
                action={async () => {
                  "use server";
                  await signIn("line", { redirectTo: callbackUrl });
                }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#00B900] hover:bg-[#00A000] text-white"
                >
                  <svg className="size-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.572-3.843 2.572-5.992zm-18.508 2.676c0 .217-.177.394-.394.394h-2.73c-.217 0-.394-.177-.394-.394v-4.266c0-.217.177-.394.394-.394h.787c.217 0 .394.177.394.394v3.085h1.549c.217 0 .394.177.394.394v.787zm2.446-.394c0 .217-.177.394-.394.394h-.787c-.217 0-.394-.177-.394-.394v-4.266c0-.217.177-.394.394-.394h.787c.217 0 .394.177.394.394v4.266zm5.969 0c0 .217-.177.394-.394.394h-.787c-.033 0-.064-.005-.094-.012l-.024-.007-.012-.003c-.027-.009-.052-.02-.075-.035l-.003-.002-.031-.023c-.005-.004-.009-.01-.014-.015l-.013-.013-.011-.013-2.042-2.765v2.5c0 .217-.177.394-.394.394h-.787c-.217 0-.394-.177-.394-.394v-4.266c0-.217.177-.394.394-.394h.787c.011 0 .021.001.031.002l.017.002.015.002c.015.002.029.006.043.01l.015.004.012.004c.014.005.027.011.04.019l.005.002c.017.01.032.021.046.034l.009.008.009.009 2.039 2.762v-2.472c0-.217.177-.394.394-.394h.787c.217 0 .394.177.394.394v4.266zm4.406-3.479c.217 0 .394.177.394.394v.787c0 .217-.177.394-.394.394h-1.549v.591h1.549c.217 0 .394.177.394.394v.787c0 .217-.177.394-.394.394h-2.73c-.217 0-.394-.177-.394-.394v-4.266c0-.217.177-.394.394-.394h2.73c.217 0 .394.177.394.394v.787c0 .217-.177.394-.394.394h-1.549v.591h1.549z" />
                  </svg>
                  LINEでログイン
                </Button>
              </form>
            )}

            {!process.env.GOOGLE_CLIENT_ID && !process.env.LINE_CLIENT_ID && (
              <p className="text-center text-muted-foreground text-sm">
                ソーシャルログインは現在設定されていません。
                環境変数でOAuth認証を設定してください。
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

