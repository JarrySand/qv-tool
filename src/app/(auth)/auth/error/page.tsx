import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "認証エラー | QV-Tool",
  description: "認証中にエラーが発生しました",
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AuthErrorPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  const errorMessages: Record<string, string> = {
    Configuration: "サーバー設定に問題があります。管理者にお問い合わせください。",
    AccessDenied: "アクセスが拒否されました。",
    Verification: "認証トークンの有効期限が切れているか、既に使用されています。",
    OAuthSignin: "OAuth認証の開始に失敗しました。",
    OAuthCallback: "OAuth認証のコールバックに失敗しました。",
    OAuthCreateAccount: "アカウントの作成に失敗しました。",
    EmailCreateAccount: "アカウントの作成に失敗しました。",
    Callback: "認証コールバックでエラーが発生しました。",
    OAuthAccountNotLinked: "このメールアドレスは別の認証方法で登録されています。",
    EmailSignin: "メール認証に失敗しました。",
    CredentialsSignin: "認証情報が正しくありません。",
    SessionRequired: "この操作にはログインが必要です。",
    Default: "認証中にエラーが発生しました。",
  };

  const errorMessage = errorMessages[error ?? "Default"] ?? errorMessages.Default;

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
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">認証エラー</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/auth/signin">もう一度ログインする</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">トップページへ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

