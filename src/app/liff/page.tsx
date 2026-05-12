"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

/**
 * LIFF エンドポイントページ
 *
 * LINE Developers Console の LIFF アプリの Endpoint URL に設定するページ。
 *
 * - LINE アプリ内（LIFF ブラウザ）で開かれた場合: LIFF SDK で取得した
 *   ID トークンを Credentials プロバイダーに渡して即ログイン（パスワード不要）
 * - 外部ブラウザで開かれた場合: 通常の LINE OAuth フローにフォールバック
 *
 * 期待される URL: /liff?eventId={idOrSlug}&token={accessToken?}
 */
function LiffPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const eventId = searchParams.get("eventId");
      const accessToken = searchParams.get("token");

      // 認証完了後のリダイレクト先を組み立てる
      // eventId がなければトップへ
      const callbackUrl = eventId
        ? `/events/${eventId}${accessToken ? `?token=${accessToken}` : ""}`
        : "/";

      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

      // LIFF_ID 未設定 or サーバー側で動いている時は通常の LINE OAuth へ
      if (!liffId) {
        await signIn("line", { callbackUrl });
        return;
      }

      try {
        // LIFF SDK は SSR で読み込めないので動的 import
        const { default: liff } = await import("@line/liff");
        await liff.init({ liffId });

        if (!liff.isInClient()) {
          // 外部ブラウザ → 通常の LINE OAuth
          await signIn("line", { callbackUrl });
          return;
        }

        // LINE アプリ内
        if (!liff.isLoggedIn()) {
          // liff.login() はそのまま現在の URL に戻ってくるのでリダイレクト不要
          liff.login();
          return;
        }

        const idToken = liff.getIDToken();
        if (!idToken) {
          // ID トークン取れない → OAuth フォールバック
          await signIn("line", { callbackUrl });
          return;
        }

        const result = await signIn("line-liff", {
          idToken,
          redirect: false,
        });

        if (result?.error) {
          console.error("LIFF signIn failed:", result.error);
          setError("ログインに失敗しました。再度お試しください。");
          // OAuth フォールバック
          await signIn("line", { callbackUrl });
          return;
        }

        router.push(callbackUrl);
      } catch (err) {
        console.error("LIFF init error:", err);
        // 何か壊れたら OAuth フォールバック
        await signIn("line", { callbackUrl });
      }
    };

    init();
    // searchParams / router は安定参照なので依存に入れて問題なし
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
        <p className="text-muted-foreground text-sm">
          {error ?? "ログイン中..."}
        </p>
      </div>
    </main>
  );
}

export default function LiffPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-4">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </main>
      }
    >
      <LiffPageInner />
    </Suspense>
  );
}
