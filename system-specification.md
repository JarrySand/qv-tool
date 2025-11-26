# Quadratic Voting System 要件定義書 (Standalone)

## 1. プロジェクト概要

### 1.1 背景
Quadratic Voting（二次投票）は、個人の選好の「強さ」を反映できる民主的な意思決定メカニズムです。参加者は一定の「クレジット」を持ち、対象に対して票を投じることができますが、投じる票数の二乗分のクレジットを消費します（例: 1票=1クレジット, 2票=4クレジット, 3票=9クレジット）。これにより、少数の強い関心を持つマイノリティの意見も反映されやすくなります。

本プロジェクトは、このメカニズムをウェブアプリケーションとして実装し、誰でも簡単に二次投票イベントを作成・実施・集計できるプラットフォームを提供することを目的とします。

### 1.2 目的・ゴール
*   **使いやすさ**: 専門知識がないユーザーでも直感的に投票イベントを作成・参加できること。
*   **公平性・透明性**: 投票ロジックが正しく機能し、結果が正確に集計されること。
*   **柔軟な認証**: 参加者の形態（特定多数、不特定多数など）に応じて最適な認証方式を選択できること。
*   **高い品質**: 最新のウェブ標準技術を用い、高速でバグの少ない安定した動作を提供すること。
*   **持続可能なOSSエコシステム**: オープンソースソフトウェアとして、誰でも貢献しやすく、長期的にメンテナンス可能な体制を築くこと。

## 2. システム構成

### 2.1 アーキテクチャ概要
本システムは、Next.js (App Router) を中核としたフルスタックWebアプリケーションとして構築します。

*   **フロントエンド**: React Server Components (RSC) を活用し、初期表示速度とSEOを最適化。
*   **バックエンド**: Next.js Server Actions および Route Handlers を使用し、APIサーバーを分離せずに実装。
*   **データベース**: PostgreSQL を使用し、Prisma ORM を介して型安全にアクセス。
*   **認証**: NextAuth.js (v5) により、OAuthプロバイダおよびカスタム認証を統合管理。

### 2.2 技術スタック
| カテゴリ | 技術選定 | 選定理由 |
| :--- | :--- | :--- |
| **Framework** | Next.js 15+ (App Router) | 最新のReact機能(RSC)による高パフォーマンス、バックエンド統合の容易さ。 |
| **Language** | TypeScript | 静的型付けによる開発効率向上とバグ削減。 |
| **Styling** | Tailwind CSS + Shadcn/ui | ユーティリティファーストによる高速なUI構築、アクセシビリティ対応。 |
| **Validation** | Zod | TypeScriptと親和性の高いスキーマバリデーション。 |
| **Database** | PostgreSQL | 信頼性の高いRDBMS。JSON型サポートも活用。 |
| **ORM** | Prisma | 型安全なDB操作、直感的なスキーマ定義。 |
| **Auth** | NextAuth.js (v5) | 柔軟かつセキュアな認証基盤。 |
| **i18n** | next-intl | App Router に対応した軽量な国際化ライブラリ。 |
| **Test** | Vitest, Playwright | 高速な単体テストと信頼性の高いE2Eテスト。 |
| **Deploy** | Vercel (推奨) | Next.jsに最適化されたホスティング環境。 |

## 3. 機能要件

### 3.1 ユーザーロール
*   **主催者 (Admin)**: 投票イベントを作成・管理するユーザー。
*   **投票者 (Voter)**: 作成されたイベントに参加し、票を投じるユーザー。

### 3.2 機能一覧

#### A. 認証機能 (Authentication)
| ID | 機能名 | 詳細 |
| :--- | :--- | :--- |
| **AUTH-01** | 個別投票 (Individual) | 主催者が発行したユニークURL (UUID) にアクセスすることで認証とみなす方式。ログイン操作不要。匿名性が高い。 |
| **AUTH-02** | Google 認証 | Google アカウント (OAuth 2.0) を使用してログインする。 |
| **AUTH-03** | LINE 認証 | LINE アカウント (OpenID Connect) を使用してログインする。 |
| **AUTH-04** | セッション管理 | ログイン状態の維持、有効期限切れ時の自動ログアウト。 |
| **AUTH-05** | 主催者認証 | 認証不要。イベント作成時に管理用トークン(adminToken)を発行し、URLで編集権限を制御。トークンを知っている人のみがイベントを編集可能。 |

#### B. イベント管理機能 (Event Management) - 主催者向け
| ID | 機能名 | 詳細 |
| :--- | :--- | :--- |
| **EVENT-01** | イベント作成 | 以下の情報を入力してイベントを作成する。<br>・イベント名、説明<br>・開催期間 (開始日時、終了日時)<br>・1人あたりの付与クレジット数<br>・認証方式の選択 (個別/Google/LINE)<br>・投票対象 (Subject) のリスト |
| **EVENT-02** | 投票対象管理 | 投票対象の追加・編集・削除。<br>各対象にはタイトル、詳細説明、参考URL、画像を設定可能。 |
| **EVENT-03** | 参加者管理 (個別投票のみ) | 投票者数に応じたユニークURLの一括生成とCSVダウンロード。 |
| **EVENT-04** | イベント編集 | 開催期間や説明文の修正。※投票開始後は公平性担保のため、投票対象やクレジット数の変更は不可とする（要検討）。 |

#### C. 投票機能 (Voting) - 投票者向け
| ID | 機能名 | 詳細 |
| :--- | :--- | :--- |
| **VOTE-01** | イベントトップ表示 | イベントの概要、説明、現在のステータス（開催中/終了）を表示。 |
| **VOTE-02** | 投票インターフェース | 各投票対象に対する「+」「-」ボタンで票数を増減。<br>消費クレジット（票数の二乗）をリアルタイム計算し、残りクレジットを表示。 |
| **VOTE-03** | バリデーション | 持ちクレジットを超える投票操作のブロック。期間外の投票ブロック。 |
| **VOTE-04** | 投票送信 | 確定した投票内容をサーバーへ送信。完了画面への遷移。 |
| **VOTE-05** | 再投票 | 投票期間内であれば、投票者は自分の投票内容を何度でも変更可能。 |

#### D. 集計・結果表示 (Result & Analytics)
| ID | 機能名 | 詳細 |
| :--- | :--- | :--- |
| **RES-01** | リアルタイム結果表示 | 現在の得票状況（各対象の総得票数）をグラフやリストで表示。 |
| **RES-02** | 結果詳細分析 | 総参加者数、総消費クレジットなどの統計情報。 |
| **RES-03** | CSVエクスポート | 投票データをCSV形式でダウンロード（ローデータ/集計データ）。 |

### 3.3 非機能要件 (保守性・品質)

#### 開発者体験 (DX)
*   **Docker化**: 開発環境 (PostgreSQL含む) を `docker-compose up` 一発で立ち上げられるようにする。
*   **DevContainer**: VS Code Remote Container の設定を提供し、環境差異によるトラブルを防ぐ。
*   **ドキュメント**: セットアップ手順、コントリビューションガイドを充実させる。

#### アクセシビリティ (a11y)
*   **WCAG 2.1 Level AA 準拠**: 公共性の高いツールとして、スクリーンリーダーやキーボード操作に完全対応する。
*   **Radix UI / Shadcn**: アクセシビリティ対応済みのコンポーネントライブラリを活用する。

#### 国際化 (i18n)
*   **多言語対応基盤**: `next-intl` を導入し、日本語/英語の切り替えを容易にする。
*   **リソース管理**: 翻訳ファイルをJSONで管理し、Crowdin等の外部ツールとの連携もしやすくする。

## 4. データモデル (Schema Design)

```prisma
// ユーザー (管理者とは限らない、認証ユーザー全般)
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  
  // 投票履歴 (Social Authの場合)
  votes         Vote[]
}

// 投票イベント
model Event {
  id              String    @id @default(cuid())
  slug            String?   @unique // URL用 (オプション)
  title           String
  description     String?   @db.Text
  startDate       DateTime
  endDate         DateTime
  creditsPerVoter Int       @default(100)
  votingMode      String    // "individual", "google", "line"
  adminToken      String    @unique @default(uuid()) // 管理用トークン（イベント編集権限の制御に使用）
  
  // リレーション
  subjects        Subject[]
  votes           Vote[]
  
  // 個別投票用のトークン管理
  accessTokens    AccessToken[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// 投票対象 (選択肢)
model Subject {
  id          String   @id @default(cuid())
  eventId     String
  title       String
  description String?  @db.Text
  url         String?  // 参考URL
  imageUrl    String?  // 画像URL
  order       Int      @default(0) // 表示順

  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  voteDetails VoteDetail[]

  @@index([eventId])
}

// 投票トークン (個別投票モード用)
model AccessToken {
  id        String   @id @default(cuid())
  token     String   @unique @default(uuid()) // URLに含まれるキー
  eventId   String
  isUsed    Boolean  @default(false)
  
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  vote      Vote?    // 1つのトークンは1つの投票に紐づく

  @@index([eventId])
}

// 投票アクション (「誰が」「どのイベントに」投票したか)
model Vote {
  id          String   @id @default(cuid())
  eventId     String
  
  // 認証タイプに応じた紐付け
  userId      String?  // Social Authの場合
  accessTokenId String? @unique // Individual Authの場合
  
  user        User?        @relation(fields: [userId], references: [id])
  accessToken AccessToken? @relation(fields: [accessTokenId], references: [id])
  event       Event        @relation(fields: [eventId], references: [id])
  
  details     VoteDetail[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt // 再投票可能な場合

  @@unique([eventId, userId]) // 1ユーザー1イベント1投票 (Social)
}

// 投票明細 (「どの対象に」「何票」入れたか)
model VoteDetail {
  id        String   @id @default(cuid())
  voteId    String
  subjectId String
  amount    Int      // 票数 (0以上の整数。マイナス投票は許可しない)
  cost      Int      // 消費クレジット (amount^2)
  
  vote      Vote     @relation(fields: [voteId], references: [id], onDelete: Cascade)
  subject   Subject  @relation(fields: [subjectId], references: [id])

  @@unique([voteId, subjectId])
}

// NextAuth 必須モデル (省略可だが記載)
model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String? @db.Text
  access_token       String? @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String? @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## 5. UI/UX デザインガイドライン

### 5.1 テーマカラー
*   **Primary**: 黒 (#000000) - 力強さと信頼性
*   **Secondary**: イエロー (#EDFF38) - アクション、強調（元のブランドカラーを継承）
*   **Background**: 白 (#FFFFFF) または 薄いグレー (#F8F9FA)

### 5.2 コンポーネント指針
*   **Shadcn/ui** をベースに使用し、一貫性のあるデザインを提供する。
*   ボタン、入力フォーム、カードなどは共通コンポーネントとして実装する。
*   モバイルファーストを意識し、スマートフォンでの操作性を最優先する。

## 6. 開発プロセス・品質基準

### 6.1 ディレクトリ構造 (src/app)
```
src/
├── app/
│   ├── (auth)/             # 認証関連ページ
│   ├── (dashboard)/        # 管理画面レイアウト
│   │   ├── admin/
│   │   │   ├── create/     # イベント作成
│   │   │   └── [id]/       # イベント管理詳細
│   ├── events/
│   │   ├── [id]/           # イベント公開ページ
│   │   │   ├── vote/       # 投票画面
│   │   │   └── result/     # 結果画面
│   └── api/                # API Routes (Webhook等)
├── components/
│   ├── ui/                 # 原子的なUIパーツ (Button, Input)
│   ├── features/           # 機能単位のコンポーネント (VoteForm, EventCard)
│   └── layout/             # ヘッダー、フッター
├── lib/
│   ├── actions/            # Server Actions (データ操作)
│   ├── db/                 # Prisma Client
│   ├── utils/              # ユーティリティ関数 (QV計算など)
│   └── validations/        # Zodスキーマ
└── types/                  # TypeScript型定義
```

### 6.2 テスト戦略
*   **Unit Test (Vitest)**: QV計算ロジック、ユーティリティ関数、独立したコンポーネント。
*   **E2E Test (Playwright)**: 重要なユーザーフロー（イベント作成→投票→結果確認）。
*   **CI (GitHub Actions)**:
    *   Pull Request 時に `lint`, `type-check`, `test:unit`, `build` を実行。
    *   `main` ブランチへのマージ前に全てのチェック通過を必須とする。

### 6.3 Lint / Format
*   ESLint (Next.js 推奨設定 + 厳格な型チェック)
*   Prettier
*   Husky + lint-staged でコミット時にチェックを強制。
