# QV-Tool 開発引き継ぎ資料

## 1. プロジェクト概要

**Quadratic Voting Tool (QV-Tool)** は、二次投票メカニズムを用いた意思決定プラットフォームです。

---

## 2. 技術スタック

| カテゴリ   | 技術                     | バージョン |
| ---------- | ------------------------ | ---------- |
| Framework  | Next.js (App Router)     | 16.0.4     |
| Language   | TypeScript               | ^5         |
| Styling    | Tailwind CSS + Shadcn/ui | v4         |
| Database   | PostgreSQL               | 16-alpine  |
| ORM        | Prisma                   | 7.0.1      |
| Validation | Zod                      | ^4.1.13    |
| Auth       | NextAuth.js (v5)         | 5.0.0-beta |
| i18n       | next-intl                | ^4.5.5     |
| Test       | Vitest + Playwright      | 導入済み   |
| Rate Limit | Upstash Redis            | オプション |

---

## 3. ディレクトリ構造

```
qv-tool/
├── prisma/
│   ├── schema.prisma          # DBスキーマ定義
│   └── migrations/            # マイグレーション履歴
├── messages/
│   ├── en.json                # 英語リソース
│   └── ja.json                # 日本語リソース
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── auth/
│   │   │       ├── signin/    # ログインページ
│   │   │       └── error/     # 認証エラーページ
│   │   ├── (dashboard)/
│   │   │   └── admin/
│   │   │       ├── create/    # イベント作成ページ
│   │   │       ├── created/   # 作成完了ページ
│   │   │       └── [id]/      # イベント管理ページ
│   │   ├── events/
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # イベント公開ページ
│   │   │       ├── vote/      # 投票画面
│   │   │       ├── complete/  # 投票完了画面
│   │   │       └── result/    # 結果画面
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/  # NextAuth API
│   │   ├── error.tsx          # エラーバウンダリ
│   │   ├── global-error.tsx   # グローバルエラー
│   │   ├── not-found.tsx      # 404ページ
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           # トップページ
│   ├── components/
│   │   ├── ui/                # Shadcn/ui コンポーネント
│   │   ├── features/          # 機能コンポーネント
│   │   │   ├── event-wizard/  # イベント作成ウィザード（分割済み）
│   │   │   │   ├── index.tsx
│   │   │   │   ├── EventWizardContext.tsx
│   │   │   │   ├── StepIndicator.tsx
│   │   │   │   ├── types.ts
│   │   │   │   └── steps/
│   │   │   ├── voting-interface.tsx
│   │   │   ├── results-chart.tsx
│   │   │   ├── csv-export-buttons.tsx
│   │   │   └── ...
│   │   └── layout/            # レイアウトコンポーネント
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── index.ts
│   ├── constants/             # 定数定義
│   │   └── index.ts
│   ├── i18n/
│   │   ├── config.ts          # i18n設定
│   │   └── request.ts         # リクエスト処理
│   ├── lib/
│   │   ├── actions/           # Server Actions
│   │   │   ├── event.ts
│   │   │   ├── subject.ts
│   │   │   ├── access-token.ts
│   │   │   ├── vote.ts
│   │   │   ├── result.ts
│   │   │   └── locale.ts
│   │   ├── auth/
│   │   │   ├── line-provider.ts    # LINE OIDCプロバイダー
│   │   │   ├── discord-guild.ts    # Discordサーバー検証
│   │   │   └── voting-auth.ts      # 投票者認証ヘルパー
│   │   ├── db/
│   │   │   └── index.ts
│   │   ├── rate-limit.ts      # レート制限
│   │   ├── utils/
│   │   │   ├── qv.ts          # QV計算
│   │   │   ├── slug.ts        # スラッグ生成
│   │   │   ├── token.ts       # トークン生成
│   │   │   └── index.ts
│   │   └── validations/
│   │       ├── event.ts
│   │       ├── subject.ts
│   │       ├── vote.ts
│   │       └── index.ts
│   ├── test/
│   │   └── setup.ts
│   ├── types/                 # 型定義
│   │   ├── next-auth.d.ts     # NextAuth型拡張
│   │   ├── event.ts
│   │   ├── vote.ts
│   │   ├── access-token.ts
│   │   └── index.ts
│   └── auth.ts                # NextAuth設定
├── e2e/                       # E2Eテスト
│   ├── home.spec.ts
│   ├── event-create.spec.ts
│   ├── voting-flow.spec.ts
│   └── results-export.spec.ts
├── docs/
│   ├── DEPLOY.md
│   ├── USER_MANUAL.md
│   └── HANDOVER.md
├── .github/
│   ├── CODEOWNERS
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docker-compose.yml
├── vercel.json
├── CONTRIBUTING.md
├── CHANGELOG.md
├── SECURITY.md
└── LICENSE
```

---

## 4. 環境セットアップ

### 初回セットアップ

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数設定
cp .env.example .env
# .env を編集

# 3. DBコンテナ起動
docker-compose up -d

# 4. Prisma Client生成 & マイグレーション
npx prisma generate
npx prisma migrate dev

# 5. 開発サーバー起動
npm run dev
```

### 主要コマンド

| コマンド                | 説明                   |
| ----------------------- | ---------------------- |
| `npm run dev`           | 開発サーバー起動       |
| `npm run build`         | プロダクションビルド   |
| `npm run lint`          | ESLint実行             |
| `npm run format`        | Prettier実行           |
| `npm run type-check`    | TypeScriptチェック     |
| `npm run test`          | ユニットテスト実行     |
| `npm run test:coverage` | カバレッジレポート生成 |
| `npm run test:e2e`      | E2Eテスト実行          |
| `npm run db:studio`     | Prisma Studio起動      |
| `npm run db:migrate`    | マイグレーション実行   |

---

## 5. 認証システム

### 認証方式

| モード       | 説明                  | 設定             |
| ------------ | --------------------- | ---------------- |
| `individual` | トークン付きURLで認証 | デフォルト       |
| `google`     | Google OAuth          | `AUTH_GOOGLE_*`  |
| `line`       | LINE OIDC             | `AUTH_LINE_*`    |
| `discord`    | Discord OAuth         | `AUTH_DISCORD_*` |

### 認証フロー

```typescript
// src/lib/auth/voting-auth.ts
const authResult = await authenticateVoter(eventId, token);
if (!authResult.authenticated) {
  // エラー処理
}
if (authResult.type === "token") {
  // 個別投票モード
} else {
  // Social認証モード
}
```

### Discord サーバー制限

Discord認証では、特定のサーバーメンバーのみ投票可能に設定できます。

```typescript
// src/lib/auth/discord-guild.ts
const isMember = await checkDiscordGuildMembership(accessToken, guildId);
```

---

## 6. 主要機能

### 6.1 イベント作成

- フォームUI: `src/components/features/event-wizard/`
- Server Action: `src/lib/actions/event.ts`
- adminToken自動生成、slug自動/手動生成

### 6.2 投票機能

- 投票UI: `src/components/features/voting-interface.tsx`
- Server Action: `src/lib/actions/vote.ts`
- QV計算: `src/lib/utils/qv.ts`

### 6.3 結果表示

- 結果ページ: `src/app/events/[id]/result/`
- Server Action: `src/lib/actions/result.ts`
- グラフ: Recharts使用

### 6.4 CSVエクスポート

- `src/components/features/csv-export-buttons.tsx`
- 集計データ・ローデータ・トークン一覧のエクスポート

---

## 7. テスト

### ユニットテスト（139テスト）

```bash
npm run test              # 実行
npm run test:coverage     # カバレッジ
```

テストファイル:

- `src/lib/utils/*.test.ts`
- `src/lib/validations/*.test.ts`
- `src/lib/actions/*.test.ts`

### E2Eテスト

```bash
npm run test:e2e
```

テストファイル:

- `e2e/home.spec.ts`
- `e2e/event-create.spec.ts`
- `e2e/voting-flow.spec.ts`
- `e2e/results-export.spec.ts`

---

## 8. レート制限

### インメモリ（デフォルト）

開発環境向け。プロセス再起動でリセット。

### Upstash Redis（推奨）

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

設定ファイル: `src/lib/rate-limit.ts`

---

## 9. 環境変数

`.env.example` を参照。主な設定:

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
AUTH_SECRET="..."
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
AUTH_LINE_ID="..."
AUTH_LINE_SECRET="..."
AUTH_DISCORD_ID="..."
AUTH_DISCORD_SECRET="..."

# Rate Limiting (Optional)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

---

## 10. 設計決定事項

| 項目         | 決定                           |
| ------------ | ------------------------------ |
| 主催者認証   | なし（誰でもイベント作成可能） |
| 再投票       | 投票期間内は何度でも変更可能   |
| マイナス投票 | なし（0以上のみ）              |
| 結果公開     | 常時リアルタイム公開           |

---

## 11. 参照ドキュメント

| ファイル              | 内容                           |
| --------------------- | ------------------------------ |
| `README.md`           | プロジェクト概要・セットアップ |
| `CONTRIBUTING.md`     | コントリビューションガイド     |
| `SECURITY.md`         | セキュリティポリシー           |
| `CHANGELOG.md`        | 変更履歴                       |
| `docs/DEPLOY.md`      | デプロイ手順                   |
| `docs/USER_MANUAL.md` | ユーザーマニュアル             |

---

**最終更新**: 2025年11月28日
