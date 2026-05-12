import type { OIDCConfig } from "next-auth/providers";

/**
 * LINE Login の ID トークン (JWT) のクレーム。
 * OIDC フローでは Auth.js が ID トークン経由でユーザー情報を取得するため、
 * userinfo エンドポイントの (`userId`, `displayName`, `pictureUrl`) ではなく
 * OIDC 標準クレーム名 (`sub`, `name`, `picture`) を使う必要がある。
 */
export interface LineProfile {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  amr?: string[];
  name?: string;
  picture?: string;
  email?: string;
}

/**
 * LINE Login OpenID Connect Provider
 * @see https://developers.line.biz/ja/docs/line-login/integrate-line-login/
 */
export default function LineProvider(options: {
  clientId: string;
  clientSecret: string;
}): OIDCConfig<LineProfile> {
  return {
    id: "line",
    name: "LINE",
    type: "oidc",
    issuer: "https://access.line.me",
    authorization: {
      url: "https://access.line.me/oauth2/v2.1/authorize",
      params: {
        scope: "profile openid",
        bot_prompt: "normal",
      },
    },
    token: "https://api.line.me/oauth2/v2.1/token",
    client: {
      token_endpoint_auth_method: "client_secret_post",
      // LINE は ID トークンを HS256 (HMAC-SHA256) で署名する。
      // OIDC デフォルトの RS256 のままだと署名検証に失敗するため明示。
      id_token_signed_response_alg: "HS256",
    },
    checks: ["state"],
    // profile() はあえて指定しない。Auth.js の defaultProfile が
    // ID トークンのクレーム (sub/name/picture) から自動でユーザー情報を
    // 組み立ててくれる。独自実装すると userinfo のフィールド名と
    // 取り違えやすく、providerAccountId が undefined になりがち。
    style: {
      bg: "#00B900",
      text: "#fff",
    },
    ...options,
  };
}
