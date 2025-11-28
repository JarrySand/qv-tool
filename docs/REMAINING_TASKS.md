# QV-Tool 残りタスク一覧

**作成日**: 2025年11月26日  
**本番URL**: https://qv-tool.vercel.app

---

## ✅ 完了済み

- [x] Vercelデプロイ
- [x] データベースセットアップ（Neon PostgreSQL）
- [x] データベースマイグレーション
- [x] 基本動作確認（イベント作成・投票）
- [x] Discord認証機能の実装（コード）

---

## 🔒 セキュリティ（推奨）

### Neonパスワード変更

チャットでパスワードを共有したため、変更を推奨します。

1. https://console.neon.tech にアクセス
2. プロジェクト → **Settings** → **Reset password**
3. 新しいパスワードをコピー
4. Vercelの環境変数 `DATABASE_URL` を更新
5. **Redeploy** を実行

---

## 🟣 Discord認証設定

### 1. Discord Developer Portalでアプリ作成

1. https://discord.com/developers/applications にアクセス
2. **New Application** をクリック
3. アプリ名: `QV-Tool` など

### 2. OAuth2設定

1. 左メニュー → **OAuth2** → **General**
2. **Client ID** をコピー
3. **Client Secret** → **Reset Secret** で生成してコピー

### 3. リダイレクトURL設定

**OAuth2** → **Redirects** に以下を追加：

```
http://localhost:3000/api/auth/callback/discord
https://qv-tool.vercel.app/api/auth/callback/discord
```

### 4. Vercel環境変数追加

https://vercel.com/sunas-projects-d1e1e545/qv-tool/settings/environment-variables

| Name                    | Value                       |
| ----------------------- | --------------------------- |
| `DISCORD_CLIENT_ID`     | （コピーしたClient ID）     |
| `DISCORD_CLIENT_SECRET` | （コピーしたClient Secret） |

### 5. 再デプロイ

Vercel Dashboard → **Deployments** → 最新の **⋮** → **Redeploy**

---

## 💻 ローカル開発環境セットアップ

### `.env.local` の作成

プロジェクトルートに `.env.local` を作成：

```env
# Database
DATABASE_URL="postgresql://ユーザー名:パスワード@localhost:5432/qv_tool"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="開発用のシークレット"

# Discord OAuth（本番と同じClient ID/Secretを使用可能）
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"

# Google OAuth（任意）
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""

# LINE OAuth（任意）
# LINE_CHANNEL_ID=""
# LINE_CHANNEL_SECRET=""
```

### ローカルDBの起動

```bash
docker-compose up -d
npx prisma migrate dev
```

---

## 📌 任意タスク（後でOK）

### Google OAuth設定

1. https://console.cloud.google.com でプロジェクト作成
2. **APIs & Services** → **Credentials** → **OAuth 2.0 Client IDs**
3. リダイレクトURI:
   ```
   http://localhost:3000/api/auth/callback/google
   https://qv-tool.vercel.app/api/auth/callback/google
   ```
4. Vercelに環境変数追加:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### LINE OAuth設定

1. https://developers.line.biz/console でチャネル作成
2. **LINE Login** → **Callback URL** に追加:
   ```
   http://localhost:3000/api/auth/callback/line
   https://qv-tool.vercel.app/api/auth/callback/line
   ```
3. Vercelに環境変数追加:
   - `LINE_CHANNEL_ID`
   - `LINE_CHANNEL_SECRET`

### カスタムドメイン設定

1. Vercel Dashboard → **Settings** → **Domains**
2. 独自ドメインを追加
3. DNSレコードを設定

---

## 📢 チームへの共有

### 共有用メッセージ例

```
QV-Tool（Quadratic Voting Tool）をデプロイしました！

🔗 URL: https://qv-tool.vercel.app

【できること】
- 二次投票（Quadratic Voting）形式のイベント作成
- 個別URL方式での投票
- リアルタイム結果表示

ぜひ触ってみてフィードバックください！
```

---

## 📊 現在の環境変数一覧

### Vercel（本番）

| 変数名                  | 設定状況    |
| ----------------------- | ----------- |
| `DATABASE_URL`          | ✅ 設定済み |
| `NEXTAUTH_URL`          | ✅ 設定済み |
| `NEXTAUTH_SECRET`       | ✅ 設定済み |
| `DISCORD_CLIENT_ID`     | ⬜ 未設定   |
| `DISCORD_CLIENT_SECRET` | ⬜ 未設定   |
| `GOOGLE_CLIENT_ID`      | ⬜ 未設定   |
| `GOOGLE_CLIENT_SECRET`  | ⬜ 未設定   |
| `LINE_CHANNEL_ID`       | ⬜ 未設定   |
| `LINE_CHANNEL_SECRET`   | ⬜ 未設定   |

---

## 参考リンク

- [Vercel Dashboard](https://vercel.com/sunas-projects-d1e1e545/qv-tool)
- [GitHub Repository](https://github.com/JarrySand/qv-tool)
- [Neon Console](https://console.neon.tech)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [デプロイ手順書](./DEPLOY.md)
- [Discord認証計画書](./DISCORD_AUTH_PLAN.md)
