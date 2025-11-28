# Discord認証機能 開発計画書

## 1. 概要

### 1.1 目的

QV-ToolにDiscord認証機能を追加し、以下の2つの機能を実現する：

1. **Discord OAuth認証**: Discordアカウントを使って、Google/LINEと同様に投票にアクセスできる
2. **Discordサーバーゲート機能**: 特定のDiscordサーバー（ギルド）に所属している人だけが投票できる制限機能

### 1.2 想定ユーザー

- Discordコミュニティ運営者（投票イベント主催者）
- Discordサーバーのメンバー（投票者）

### 1.3 技術スタック

- **認証**: NextAuth.js v5 + Discord OAuth2
- **Discord API**: ギルドメンバーシップ確認用
- **データベース**: PostgreSQL + Prisma

---

## 2. 機能詳細

### 2.1 機能①: Discord OAuth認証

#### 概要

GoogleやLINE認証と同様に、Discordアカウントでログインして投票できる機能。

#### 要件

| 項目           | 内容                                             |
| -------------- | ------------------------------------------------ |
| 認証方式       | Discord OAuth 2.0                                |
| 必要なスコープ | `identify`, `email`                              |
| ユーザー情報   | Discord ID、ユーザー名、アバター、メールアドレス |
| セッション管理 | 既存のNextAuth.jsの仕組みを利用                  |

#### フロー

```
[投票ページ] → [Discordで認証] → [Discord認可画面] → [コールバック] → [投票可能]
```

#### 影響範囲

- `src/auth.ts`: Discordプロバイダー追加
- `src/lib/validations/event.ts`: votingModeに "discord" 追加
- `src/components/features/event-create-form.tsx`: 認証方式の選択肢追加
- `src/app/(auth)/auth/signin/page.tsx`: Discordログインボタン追加
- `src/lib/auth/voting-auth.ts`: Discord認証対応
- 翻訳ファイル（messages/ja.json, messages/en.json）

---

### 2.2 機能②: Discordサーバーゲート機能

#### 概要

イベント作成時に特定のDiscordサーバーを指定し、そのサーバーのメンバーのみが投票できるようにする機能。

#### 要件

| 項目               | 内容                                                       |
| ------------------ | ---------------------------------------------------------- |
| 追加スコープ       | `guilds`（ユーザーの所属サーバー一覧取得）                 |
| チェックタイミング | 投票ページアクセス時                                       |
| 設定方法           | イベント作成時にサーバーID（Guild ID）を入力               |
| エラー表示         | 非メンバーには「このサーバーのメンバーのみ投票可能」と表示 |

#### フロー

```
[投票ページ] → [Discord認証] → [サーバーメンバーシップ確認]
                                  ↓
                    [メンバー] → [投票可能]
                    [非メンバー] → [エラー表示]
```

#### データベース変更

```prisma
model Event {
  // 既存フィールド...

  // Discord ゲート機能用（新規追加）
  discordGuildId   String?  // 対象DiscordサーバーのID
  discordGuildName String?  // サーバー名（表示用）
}
```

#### 影響範囲

- `prisma/schema.prisma`: Event モデルに `discordGuildId`, `discordGuildName` 追加
- `src/auth.ts`: `guilds` スコープの追加、アクセストークン保存
- `src/lib/auth/discord-guild.ts`: 新規作成（ギルドメンバーシップ確認ロジック）
- `src/components/features/event-create-form.tsx`: サーバーID入力フィールド追加（条件付き表示）
- `src/lib/auth/voting-auth.ts`: ギルドメンバーシップ検証追加
- イベント公開ページ: ゲート条件の表示

---

## 3. 実装フェーズ

### Phase A: 基本Discord認証（目安: 2-3時間）

#### A-1. 環境設定

- [ ] Discord Developer Portalでアプリケーション作成
- [ ] OAuth2設定（リダイレクトURI設定）
- [ ] 環境変数の追加（`.env.example`更新）
  ```env
  DISCORD_CLIENT_ID=
  DISCORD_CLIENT_SECRET=
  ```

#### A-2. NextAuth.js Discord プロバイダー追加

- [ ] `src/auth.ts` にDiscordプロバイダー追加
- [ ] 認証コールバックの設定

#### A-3. UI更新

- [ ] サインインページにDiscordボタン追加
- [ ] イベント作成フォームに「Discord認証」オプション追加

#### A-4. バリデーション更新

- [ ] `votingMode`に "discord" を追加
- [ ] voting-auth.tsでDiscord認証対応

#### A-5. 翻訳追加

- [ ] messages/ja.json 更新
- [ ] messages/en.json 更新

#### 成果物

- Discordアカウントで投票ができる状態

---

### Phase B: サーバーゲート機能（目安: 3-4時間）

#### B-1. データベース拡張

- [ ] Prismaスキーマ更新（discordGuildId, discordGuildName追加）
- [ ] マイグレーション実行

#### B-2. Discord API連携

- [ ] `src/lib/auth/discord-guild.ts` 作成
  - ユーザーの所属ギルド一覧取得
  - 特定ギルドへの所属確認
- [ ] アクセストークンの保存設定（auth.ts）

#### B-3. 認証フロー拡張

- [ ] `voting-auth.ts` にギルドチェック追加
- [ ] 非メンバー向けエラーハンドリング

#### B-4. UI更新

- [ ] イベント作成フォームにサーバーID入力欄追加（votingMode="discord"時のみ表示）
- [ ] サーバーIDのバリデーション
- [ ] イベント詳細ページにゲート条件表示

#### B-5. テスト

- [ ] 単体テスト追加
- [ ] 手動テスト（実際のDiscordサーバーで検証）

#### 成果物

- 特定サーバーメンバーのみ投票可能な制限機能

---

## 4. 技術詳細

### 4.1 Discord OAuth2 設定

#### 必要なスコープ

| スコープ   | 用途                       | 必須/オプション      |
| ---------- | -------------------------- | -------------------- |
| `identify` | ユーザーID、ユーザー名取得 | 必須                 |
| `email`    | メールアドレス取得         | 必須                 |
| `guilds`   | 所属サーバー一覧取得       | ゲート機能使用時のみ |

#### リダイレクトURI

- 開発環境: `http://localhost:3000/api/auth/callback/discord`
- 本番環境: `https://your-domain.com/api/auth/callback/discord`

### 4.2 NextAuth.js 設定例

```typescript
// src/auth.ts
import Discord from "next-auth/providers/discord";

// Discord認証（環境変数が設定されている場合のみ有効化）
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "identify email guilds",
        },
      },
    })
  );
}
```

### 4.3 ギルドメンバーシップ確認 API

```typescript
// src/lib/auth/discord-guild.ts
const DISCORD_API_BASE = "https://discord.com/api/v10";

export async function getUserGuilds(accessToken: string): Promise<Guild[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}

export async function isGuildMember(
  accessToken: string,
  guildId: string
): Promise<boolean> {
  const guilds = await getUserGuilds(accessToken);
  return guilds.some((guild) => guild.id === guildId);
}
```

### 4.4 データベーススキーマ変更

```prisma
model Event {
  // 既存フィールド...

  // Discord ゲート機能用
  discordGuildId   String?  // 対象DiscordサーバーのID（18桁の数値文字列）
  discordGuildName String?  // サーバー名（表示用、オプション）
}
```

---

## 5. UI/UX設計

### 5.1 イベント作成フォーム

認証方式「Discord認証」選択時に追加オプションを表示：

```
認証方式: [Discord認証 ▼]

□ 特定サーバーのメンバーに限定する
  └─ サーバーID: [________________]
     (Discord Developer PortalまたはサーバーIDをコピーして入力)
```

### 5.2 サインインページ

```
┌─────────────────────────────────┐
│         ログイン                │
├─────────────────────────────────┤
│                                 │
│  [ 🔵 Google でログイン ]        │
│                                 │
│  [ 🟢 LINE でログイン ]          │
│                                 │
│  [ 🟣 Discord でログイン ]  ← 新規 │
│                                 │
└─────────────────────────────────┘
```

### 5.3 エラー表示（非メンバー時）

```
┌─────────────────────────────────┐
│  ⚠️ 投票できません              │
│                                 │
│  この投票は「○○サーバー」の     │
│  メンバーのみ参加可能です。      │
│                                 │
│  サーバーに参加してから         │
│  再度お試しください。            │
│                                 │
│  [サーバーに参加する]            │
└─────────────────────────────────┘
```

---

## 6. セキュリティ考慮事項

### 6.1 アクセストークン管理

- Discord APIアクセストークンはサーバーサイドでのみ使用
- トークンは暗号化してデータベースに保存（NextAuth.jsのAccountモデル）
- トークンの有効期限管理とリフレッシュ処理

### 6.2 レート制限

- Discord APIにはレート制限あり（50リクエスト/秒）
- ギルドメンバーシップ確認はキャッシュを検討（Redis等）
- 本番環境ではUpstash Redisを推奨

### 6.3 権限の最小化

- 必要最小限のスコープのみ要求
- `guilds` スコープは読み取り専用（投稿権限なし）

---

## 7. テスト計画

### 7.1 単体テスト

- [ ] Discord OAuth設定のテスト
- [ ] ギルドメンバーシップ確認ロジックのテスト
- [ ] バリデーションスキーマのテスト

### 7.2 統合テスト

- [ ] Discord認証フロー全体
- [ ] ゲート機能の動作確認

### 7.3 手動テスト

- [ ] 実際のDiscordアカウントでの認証
- [ ] 実際のDiscordサーバーでのゲート機能確認
- [ ] エラーケースの確認（非メンバー、無効なサーバーID等）

---

## 8. 環境変数

### 追加する環境変数

```env
# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

### Discord Developer Portal 設定手順

1. https://discord.com/developers/applications にアクセス
2. 「New Application」でアプリケーション作成
3. OAuth2 → General
   - Client ID をコピー → `DISCORD_CLIENT_ID`
   - Client Secret を生成 → `DISCORD_CLIENT_SECRET`
4. OAuth2 → Redirects
   - 開発: `http://localhost:3000/api/auth/callback/discord`
   - 本番: `https://your-domain.com/api/auth/callback/discord`

---

## 9. デプロイ時の注意

### Vercel環境変数

- `DISCORD_CLIENT_ID`: Discord Developer PortalのClient ID
- `DISCORD_CLIENT_SECRET`: Discord Developer PortalのClient Secret

### 本番用リダイレクトURI

- Discord Developer Portal で本番URLを追加

---

## 10. 今後の拡張可能性

### 10.1 Bot連携（将来検討）

- Discordボットによる投票通知
- サーバー内での投票結果共有

### 10.2 ロールベースゲート（将来検討）

- 特定のロールを持つメンバーのみ投票可能
- 追加スコープ: `guilds.members.read`

### 10.3 複数サーバー対応（将来検討）

- OR条件: いずれかのサーバーに所属
- AND条件: すべてのサーバーに所属

---

## 11. チェックリスト（実装開始前）

### 事前準備

- [ ] Discord Developer Portalへのアクセス確認
- [ ] テスト用Discordサーバーの準備
- [ ] テスト用Discordアカウントの準備

### 開発環境

- [ ] ローカル環境の動作確認
- [ ] 環境変数の設定

---

**作成日**: 2025年11月26日
**作成者**: AI Assistant
**ステータス**: 計画段階

---

## 実装進捗

| フェーズ | タスク                       | ステータス        |
| -------- | ---------------------------- | ----------------- |
| Phase A  | A-1. 環境設定                | ✅ 完了           |
| Phase A  | A-2. Discordプロバイダー追加 | ✅ 完了           |
| Phase A  | A-3. UI更新                  | ✅ 完了           |
| Phase A  | A-4. バリデーション更新      | ✅ 完了           |
| Phase A  | A-5. 翻訳追加                | ✅ 完了           |
| Phase B  | B-1. データベース拡張        | ✅ 完了           |
| Phase B  | B-2. Discord API連携         | ✅ 完了           |
| Phase B  | B-3. 認証フロー拡張          | ✅ 完了           |
| Phase B  | B-4. UI更新                  | ✅ 完了           |
| Phase B  | B-5. テスト                  | ⏳ 手動テスト待ち |

### 実装完了日: 2025年11月26日

### 実装されたファイル

**Phase A（基本Discord認証）:**

- `src/auth.ts` - Discordプロバイダー追加
- `src/lib/validations/event.ts` - votingModeに "discord" 追加
- `src/components/features/event-create-form.tsx` - Discord選択肢追加
- `src/app/(auth)/auth/signin/page.tsx` - Discordログインボタン追加
- `src/lib/auth/voting-auth.ts` - Discord認証対応
- `src/types/next-auth.d.ts` - セッション型拡張
- `messages/ja.json`, `messages/en.json` - 翻訳追加

**Phase B（サーバーゲート機能）:**

- `prisma/schema.prisma` - discordGuildId, discordGuildName追加
- `prisma/migrations/20251126074602_add_discord_gate/` - マイグレーション
- `src/lib/auth/discord-guild.ts` - 新規作成（ギルドメンバーシップ確認）
- `src/lib/actions/event.ts` - Discord設定保存対応
- `src/components/features/event-create-form.tsx` - ゲート設定UI追加
