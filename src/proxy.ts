import { NextResponse, type NextRequest } from "next/server";

/**
 * プロキシ（旧ミドルウェア）
 * Edge Runtimeで動作するため、Prismaは使用不可
 * 認証チェックはページ側で行う
 */
export function proxy(req: NextRequest) {
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

  // その他のルートはそのまま通過
  return NextResponse.next();
}

export const config = {
  matcher: [
    // 管理ルート（トークンチェック）
    "/admin/:path*",
  ],
};
