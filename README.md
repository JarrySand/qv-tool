# QV-Tool (Quadratic Voting Tool)

二次投票（Quadratic Voting）メカニズムを用いた意思決定プラットフォームです。

## 概要

Quadratic Voting（二次投票）は、個人の選好の強さを反映できる投票方式です。参加者は一定の「クレジット」を持ち、対象に票を投じることができますが、投じる票数の二乗分のクレジットを消費します。

| 票数 | 消費クレジット |
| ---- | -------------- |
| 1票  | 1              |
| 2票  | 4              |
| 3票  | 9              |
| 10票 | 100            |

これにより、強い関心を持つ少数派の意見も適切に反映されます。

## 主な機能

- **投票イベント作成** - 誰でも簡単に投票イベントを作成可能
- **複数の認証方式** - 個別URL / Google / LINE / Discord から選択
- **リアルタイム結果表示** - 投票結果をグラフで可視化
- **CSVエクスポート** - 投票結果・トークン一覧のダウンロード
- **多言語対応** - 日本語 / 英語
- **アクセシビリティ** - WCAG 2.1 Level AA 準拠

## 技術スタック

| カテゴリ       | 技術                     |
| -------------- | ------------------------ |
| Framework      | Next.js 15+ (App Router) |
| Language       | TypeScript (strict mode) |
| Styling        | Tailwind CSS + Shadcn/ui |
| Database       | PostgreSQL + Prisma      |
| Authentication | NextAuth.js v5           |
| Validation     | Zod                      |
| i18n           | next-intl                |
| Testing        | Vitest + Playwright      |
| Rate Limiting  | Upstash Redis (optional) |

## Getting Started

### 前提条件

- Node.js 20+
- Docker & Docker Compose

### セットアップ

```bash
# 1. リポジトリのクローン
git clone https://github.com/JarrySand/qv-tool.git
cd qv-tool

# 2. 環境変数の設定
cp .env.example .env
# .env ファイルを編集

# 3. データベースの起動
docker-compose up -d

# 4. 依存関係のインストールとマイグレーション
npm install
npx prisma migrate dev

# 5. 開発サーバーの起動
npm run dev
```

http://localhost:3000 をブラウザで開いてください。

## Scripts

| コマンド                | 説明                       |
| ----------------------- | -------------------------- |
| `npm run dev`           | 開発サーバーを起動         |
| `npm run build`         | プロダクションビルド       |
| `npm run start`         | プロダクションサーバー起動 |
| `npm run lint`          | ESLint を実行              |
| `npm run format`        | Prettier でフォーマット    |
| `npm run type-check`    | TypeScript 型チェック      |
| `npm run test`          | ユニットテストを実行       |
| `npm run test:coverage` | カバレッジレポート生成     |
| `npm run test:e2e`      | E2E テストを実行           |
| `npm run db:studio`     | Prisma Studio を起動       |

## ディレクトリ構造

```
src/
├── app/                      # App Router ページ
│   ├── (auth)/              # 認証関連ページ
│   ├── (dashboard)/         # 管理画面
│   │   └── admin/           # イベント管理
│   ├── events/[id]/         # イベント公開ページ
│   │   ├── vote/            # 投票画面
│   │   ├── result/          # 結果画面
│   │   └── complete/        # 完了画面
│   └── api/                 # API Routes
├── components/
│   ├── ui/                  # 基本UIコンポーネント (Shadcn/ui)
│   ├── features/            # 機能コンポーネント
│   │   └── event-wizard/    # イベント作成ウィザード
│   └── layout/              # レイアウト (Header, Footer)
├── lib/
│   ├── actions/             # Server Actions
│   ├── auth/                # 認証ヘルパー
│   ├── db/                  # Prisma Client
│   ├── utils/               # ユーティリティ関数
│   └── validations/         # Zod スキーマ
├── constants/               # 定数定義
├── types/                   # TypeScript 型定義
└── i18n/                    # 国際化設定
```

## 認証方式

| モード       | 説明                                          |
| ------------ | --------------------------------------------- |
| `individual` | アクセストークン付きURLで認証（匿名投票向け） |
| `google`     | Google アカウントで認証                       |
| `line`       | LINE アカウントで認証                         |
| `discord`    | Discord アカウントで認証（サーバー制限可能）  |

## 環境変数

必要な環境変数は `.env.example` を参照してください。主な設定項目：

- `DATABASE_URL` - PostgreSQL 接続文字列
- `AUTH_SECRET` - NextAuth シークレット
- `AUTH_GOOGLE_*` - Google OAuth 設定
- `AUTH_LINE_*` - LINE OAuth 設定
- `AUTH_DISCORD_*` - Discord OAuth 設定
- `UPSTASH_REDIS_*` - Redis レート制限（オプション）

## ドキュメント

- [デプロイガイド](docs/DEPLOY.md)
- [ユーザーマニュアル](docs/USER_MANUAL.md)
- [開発引き継ぎ資料](docs/HANDOVER.md)

## Contributing

コントリビューションを歓迎します。詳しくは [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

## License

[MIT License](LICENSE)
