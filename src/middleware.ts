import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname, searchParams } = req.nextUrl;

  // 管理ルートのチェック（adminTokenによる認証）
  if (pathname.match(/^\/admin\/[^/]+/) && !pathname.includes("/create")) {
    const token = searchParams.get("token");
    if (!token) {
      // トークンがない場合は404にリダイレクト
      return NextResponse.redirect(new URL("/", req.url));
    }
    // トークンの検証はページ側で行う
  }

  // 投票ルートのチェック
  if (pathname.match(/^\/events\/[^/]+\/vote/)) {
    const token = searchParams.get("token");

    // 個別URL方式の場合はトークンがあればOK
    if (token) {
      return NextResponse.next();
    }

    // Social認証が必要な場合
    // ここでは認証状態のみチェック、イベントの認証方式は
    // ページ側で確認する
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // 認証が必要なルート
    "/admin/:path*",
    "/events/:path*/vote",
    // NextAuthのAPIルート
    "/api/auth/:path*",
  ],
};

