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
        scope: "profile openid email",
        bot_prompt: "normal",
      },
    },
    token: "https://api.line.me/oauth2/v2.1/token",
    userinfo: "https://api.line.me/v2/profile",
    client: {
      token_endpoint_auth_method: "client_secret_post",
    },
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
