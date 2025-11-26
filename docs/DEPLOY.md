# QV-Tool デプロイ手順書

このドキュメントでは、QV-Tool を本番環境にデプロイする手順を説明します。

## 目次

1. [前提条件](#前提条件)
2. [Vercel へのデプロイ](#vercel-へのデプロイ)
3. [環境変数の設定](#環境変数の設定)
4. [データベースのセットアップ](#データベースのセットアップ)
5. [OAuth プロバイダーの設定](#oauth-プロバイダーの設定)
6. [デプロイ後の確認](#デプロイ後の確認)

---

## 前提条件

- GitHub アカウント
- Vercel アカウント（GitHub と連携済み）
- PostgreSQL データベース（以下のサービスを推奨）
  - [Neon](https://neon.tech/) - 無料プランあり
  - [Supabase](https://supabase.com/) - 無料プランあり
  - [Railway](https://railway.app/)

---

## Vercel へのデプロイ

### 1. リポジトリの準備

```bash
# リポジトリをフォークまたはクローン
git clone https://github.com/your-username/qv-tool.git
cd qv-tool

# 本番用の変更があればコミット
git push origin main
```

### 2. Vercel にインポート

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. **Add New Project** をクリック
3. GitHub リポジトリ `qv-tool` を選択
4. **Framework Preset**: `Next.js` が自動選択される
5. **Environment Variables** を設定（後述）
6. **Deploy** をクリック

### 3. ビルド設定

`vercel.json` は既に設定済みです：

```json
{
  "framework": "nextjs",
  "regions": ["hnd1"]
}
```

- `hnd1`: 東京リージョン（日本向けに最適化）

---

## 環境変数の設定

Vercel Dashboard → Project → Settings → Environment Variables で以下を設定：

### 必須

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | PostgreSQL 接続文字列 | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | アプリケーションの URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth のシークレット | `openssl rand -base64 32` で生成 |

### OAuth プロバイダー（任意）

| 変数名 | 説明 |
|--------|------|
| `GOOGLE_CLIENT_ID` | Google OAuth クライアント ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット |
| `LINE_CHANNEL_ID` | LINE Login チャネル ID |
| `LINE_CHANNEL_SECRET` | LINE Login チャネルシークレット |
| `DISCORD_CLIENT_ID` | Discord OAuth クライアント ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth クライアントシークレット |

### シークレット生成

```bash
# NEXTAUTH_SECRET を生成
openssl rand -base64 32
```

---

## データベースのセットアップ

### Neon を使用する場合

1. [Neon Console](https://console.neon.tech/) でプロジェクトを作成
2. **Connection String** をコピー
3. Vercel に `DATABASE_URL` として設定

### マイグレーションの実行

デプロイ後、初回のみマイグレーションを実行：

```bash
# ローカルから実行
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

または、Vercel の **Deployments** → **Functions** タブからログを確認し、
`npx prisma migrate deploy` を CI/CD に組み込むこともできます。

**推奨**: GitHub Actions でマイグレーションを自動化

```yaml
# .github/workflows/deploy.yml に追加
- name: Run Prisma Migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## OAuth プロバイダーの設定

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
3. **Authorized redirect URIs** に以下を追加：
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
4. Client ID と Client Secret を Vercel に設定

### LINE Login

1. [LINE Developers Console](https://developers.line.biz/console/) でチャネルを作成
2. **LINE Login** タブで **Callback URL** を設定：
   ```
   https://your-app.vercel.app/api/auth/callback/line
   ```
3. Channel ID と Channel Secret を Vercel に設定

### Discord OAuth

1. [Discord Developer Portal](https://discord.com/developers/applications) でアプリケーションを作成
2. **OAuth2** → **General** で Client ID と Client Secret を確認
3. **OAuth2** → **Redirects** に以下を追加：
   ```
   https://your-app.vercel.app/api/auth/callback/discord
   ```
4. Client ID と Client Secret を Vercel に設定

#### Discord サーバーゲート機能

特定のDiscordサーバーのメンバーのみ投票可能にする機能を使用する場合：

1. イベント作成時に「Discordアカウント」認証を選択
2. 「特定のDiscordサーバーメンバーに限定する」にチェック
3. サーバーID（18桁の数値）を入力
   - サーバーIDの確認方法：
     - Discord設定 → 詳細設定 → 開発者モードを有効化
     - サーバー名を右クリック → 「IDをコピー」

---

## デプロイ後の確認

### 1. 基本動作確認

- [ ] トップページが表示される
- [ ] 言語切り替えが動作する
- [ ] イベント作成ページにアクセスできる

### 2. 認証確認

- [ ] Google ログインが動作する（設定した場合）
- [ ] LINE ログインが動作する（設定した場合）
- [ ] Discord ログインが動作する（設定した場合）

### 3. 機能確認

- [ ] イベントを作成できる
- [ ] 投票対象を追加できる
- [ ] 投票ができる
- [ ] 結果が表示される

### 4. パフォーマンス確認

[Lighthouse](https://developers.google.com/web/tools/lighthouse) でスコアを確認：

- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

---

## トラブルシューティング

### データベース接続エラー

```
PrismaClientInitializationError: Can't reach database server
```

**解決策**:
- `DATABASE_URL` が正しく設定されているか確認
- データベースがパブリックアクセスを許可しているか確認
- Vercel の IP がファイアウォールで許可されているか確認

### OAuth リダイレクトエラー

```
Error: OAuthCallback error
```

**解決策**:
- `NEXTAUTH_URL` が正しく設定されているか確認
- OAuth プロバイダーの Redirect URI が正しいか確認
- `NEXTAUTH_SECRET` が設定されているか確認

### ビルドエラー

```
Build failed
```

**解決策**:
- ローカルで `npm run build` が成功するか確認
- `npm run lint` と `npm run type-check` でエラーがないか確認

---

## 更新とロールバック

### 更新

1. `main` ブランチにプッシュすると自動デプロイ
2. または Vercel Dashboard から手動デプロイ

### ロールバック

1. Vercel Dashboard → Deployments
2. 以前の正常なデプロイを選択
3. **Promote to Production** をクリック

---

## セキュリティ考慮事項

- [ ] 環境変数は Vercel の暗号化ストレージに保存される
- [ ] `NEXTAUTH_SECRET` は本番環境専用の値を使用
- [ ] データベース接続は SSL を使用（`?sslmode=require`）
- [ ] 管理用トークン（`adminToken`）の漏洩に注意

---

## レート制限の設定（推奨）

本番環境でのセキュリティ強化のため、レート制限の導入を推奨します。

### Upstash Redis を使用する場合

[Upstash](https://upstash.com/) は Vercel と統合されたサーバーレス Redis サービスです。

#### 1. Upstash アカウントの作成

1. [Upstash Console](https://console.upstash.com/) でアカウント作成
2. **Create Database** → リージョンを選択（`ap-northeast-1` 推奨）
3. 接続情報をコピー

#### 2. パッケージのインストール

```bash
npm install @upstash/redis @upstash/ratelimit
```

#### 3. 環境変数の設定

| 変数名 | 説明 |
|--------|------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST API URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST API トークン |

#### 4. レート制限の実装例

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 投票送信: 1分間に5回まで
export const voteRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "ratelimit:vote",
});

// イベント作成: 1時間に10回まで
export const eventCreateRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "ratelimit:event",
});
```

#### 5. Server Action での使用例

```typescript
// src/lib/actions/vote.ts
import { voteRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function submitVote(input: SubmitVoteInput) {
  // レート制限チェック
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "anonymous";
  const { success, limit, reset, remaining } = await voteRateLimit.limit(ip);

  if (!success) {
    return {
      success: false,
      error: `投票の送信回数が上限に達しました。${Math.ceil((reset - Date.now()) / 1000)}秒後に再試行してください。`,
    };
  }

  // 既存の投票処理...
}
```

### Vercel KV を使用する場合

Vercel KV は Upstash Redis をベースにした統合サービスです。

1. Vercel Dashboard → Storage → Create Database → KV
2. 環境変数が自動的に設定される
3. 上記と同様の実装で使用可能

---

**最終更新**: 2025年11月26日

