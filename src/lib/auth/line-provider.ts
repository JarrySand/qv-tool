import type { OIDCConfig } from "next-auth/providers";

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
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
    userinfo: "https://api.line.me/v2/profile",
    client: {
      token_endpoint_auth_method: "client_secret_post",
      // LINE は ID トークンを HS256 (HMAC-SHA256) で署名する。
      // OIDC デフォルトの RS256 のままだと署名検証に失敗するため明示。
      id_token_signed_response_alg: "HS256",
    },
    checks: ["state"],
    profile(profile) {
      return {
        id: profile.userId,
        name: profile.displayName,
        email: profile.email,
        image: profile.pictureUrl,
      };
    },
    style: {
      bg: "#00B900",
      text: "#fff",
    },
    ...options,
  };
}
