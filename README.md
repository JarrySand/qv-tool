# QV-Tool (Quadratic Voting Tool)

**QV-Tool** は、二次投票（Quadratic Voting）メカニズムを用いた民主的な意思決定プラットフォームです。

## 🎯 概要

Quadratic Voting（二次投票）は、個人の選好の「強さ」を反映できる投票方式です。参加者は一定の「クレジット」を持ち、対象に対して票を投じることができますが、投じる票数の二乗分のクレジットを消費します。

| 票数 | 消費クレジット |
| ---- | -------------- |
| 1票  | 1クレジット    |
| 2票  | 4クレジット    |
| 3票  | 9クレジット    |

これにより、少数の強い関心を持つマイノリティの意見も反映されやすくなります。

## ✨ 主な機能

- 🗳️ **投票イベント作成**: 誰でも簡単に投票イベントを作成可能
- 🔐 **柔軟な認証**: 個別URL / Google / LINE から選択可能
- 📊 **リアルタイム結果表示**: 投票結果をリアルタイムで可視化
- 📱 **モバイルファースト**: スマートフォンでの操作性を最優先
- 🌍 **多言語対応**: 日本語 / 英語に対応
- ♿ **アクセシビリティ**: WCAG 2.1 Level AA 準拠

## 🛠️ 技術スタック

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Database**: PostgreSQL + Prisma
- **Authentication**: NextAuth.js v5
- **Testing**: Vitest + Playwright

## 🚀 Getting Started

### 前提条件

- Node.js 20+
- Docker & Docker Compose

### セットアップ

1. **リポジトリのクローン**

```bash
git clone https://github.com/your-username/qv-tool.git
cd qv-tool
```

2. **環境変数の設定**

```bash
cp .env.example .env
# .env ファイルを編集して必要な値を設定
```

3. **データベースの起動**

```bash
docker-compose up -d
```

4. **依存関係のインストールとマイグレーション**

```bash
npm install
npx prisma migrate dev
```

5. **開発サーバーの起動**

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

### DevContainer での開発（推奨）

VS Code の [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) 拡張機能を使用すると、環境構築なしで開発を始められます。

1. VS Code でプロジェクトを開く
2. コマンドパレットから `Dev Containers: Reopen in Container` を選択

## 📜 Scripts

| コマンド            | 説明                         |
| ------------------- | ---------------------------- |
| `npm run dev`       | 開発サーバーを起動           |
| `npm run build`     | プロダクションビルドを作成   |
| `npm run start`     | プロダクションサーバーを起動 |
| `npm run lint`      | ESLint を実行                |
| `npm run format`    | Prettier でフォーマット      |
| `npm run test`      | 単体テストを実行             |
| `npm run test:e2e`  | E2E テストを実行             |
| `npm run db:studio` | Prisma Studio を起動         |

## 📁 ディレクトリ構造

```
src/
├── app/
│   ├── (auth)/             # 認証関連ページ
│   ├── (dashboard)/        # 管理画面レイアウト
│   │   └── admin/          # イベント管理
│   ├── events/             # イベント公開ページ
│   │   └── [id]/           # 投票・結果画面
│   └── api/                # API Routes
├── components/
│   ├── ui/                 # UIコンポーネント
│   ├── features/           # 機能コンポーネント
│   └── layout/             # レイアウトコンポーネント
├── lib/
│   ├── actions/            # Server Actions
│   ├── db/                 # Prisma Client
│   ├── utils/              # ユーティリティ関数
│   └── validations/        # Zod スキーマ
└── types/                  # TypeScript 型定義
```

## 🤝 Contributing

コントリビューションを歓迎します！詳しくは [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

## 📄 License

[MIT License](LICENSE)
