# Favboard（ファブボード）

好きなもの・こだわり・関心を集めるビジュアルボード。

見出し・テキスト・区切り線・Bento グリッドでドキュメントを組み立て、商品の画像・ブランド・価格・公式サイト・こだわりコメントを公開できます。

## 技術スタック

- **Framework**: Next.js 16 (App Router, TypeScript, React 19)
- **Styling**: Tailwind CSS v4, shadcn/ui 風コンポーネント
- **Layout**: 縦ドキュメント + Bento グリッド（商品 / テキストを配置）
- **Backend / Database**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Images**: Sharp（OGP 生成）、商品画像は Supabase Storage
- **Deployment**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) で新規プロジェクトを作成
2. SQL Editor でマイグレーションを順に実行:

| ファイル | 内容 |
|----------|------|
| `supabase/migrations/001_canvases.sql` | キャンバステーブル + RLS |
| `supabase/migrations/002_profiles.sql` | プロフィール + 新規ユーザー時の自動作成 |
| `supabase/migrations/003_canvas_limit.sql` | 1 アカウントあたりリスト上限 3 |
| `supabase/migrations/004_example_canvas_granted.sql` | スターター例示リストの付与フラグ |
| `supabase/migrations/005_product_images_storage.sql` | 商品画像用 Storage バケット `product-images` |
| `supabase/migrations/006_avatars_and_canvas_list.sql` | アバター用 Storage + 一覧用 `block_count` |

3. Authentication → Providers で **X / Twitter (OAuth 2.0)** を有効化（下記「X ログイン」参照）
4. Authentication → URL Configuration の Redirect URLs に `http://localhost:3000/auth/callback`（と本番の `/auth/callback`）を追加

### 3. ワンコマンドセットアップ（Windows）

```powershell
.\setup.ps1
```

`.env.local` の作成・依存関係のインストール・`supabase/config.toml` の確認まで行います。その後、上記マイグレーションを SQL Editor で実行し、環境変数を埋めてください。

### 4. 環境変数

`.env.example` を `.env.local` にコピーして値を設定:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env.local
```

**macOS / Linux:**
```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

アカウント削除を有効にする場合は、サーバー専用キーも追加します（クライアントや Git に含めないでください）:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

未設定のままでも閲覧・編集・公開は動作しますが、ダッシュボードの「アカウント削除」は失敗します。

### 5. X（Twitter）ログイン

ログイン UI は **X OAuth のみ**です（メール／パスワードはコード上に残していますが、現状の画面では出しません）。Client ID / Secret は Next.js の `.env` ではなく **Supabase Dashboard** に保存します。

1. [X Developer Portal](https://developer.x.com/) でアプリを作成し、OAuth 2.0 を有効化
2. Callback URL に `https://<project-ref>.supabase.co/auth/v1/callback` を登録（アプリの `localhost` ではない）
3. 可能なら「Request email from users」を有効化
4. Supabase Dashboard → Authentication → Providers → **X / Twitter (OAuth 2.0)** を ON にし、Client ID / Secret を貼り付け
5. Redirect URLs に `/auth/callback` を追加（手順 2 と同様）

設定後、`/login` の「Xでログイン」から認可フローが始まり、成功するとダッシュボード（または `redirect` クエリ）に戻ります。ログイン時点で利用規約・プライバシーポリシーへの同意とみなします。

### 6. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 を開く

## 主要ルート

| パス | 説明 |
|------|------|
| `/` | ランディングページ |
| `/login` | X ログイン |
| `/auth/callback` | OAuth コールバック |
| `/dashboard` | プロフィール / マイリスト / アカウント削除 |
| `/edit/[id]` | キャンバス編集 |
| `/c/[slug]` | 公開閲覧ページ（OGP / Twitter Card 対応） |
| `/terms` | 利用規約 |
| `/privacy` | プライバシーポリシー |
| `/api/canvases` | キャンバス一覧・作成 |
| `/api/canvases/[id]` | キャンバス取得・更新・削除 |
| `/api/profile` | プロフィール取得・更新 |
| `/api/account` | アカウント削除（`DELETE`、サービスロール必須） |

## コア機能

### ボード編集

- 縦に **見出し / テキスト / 区切り線 / Bento** を追加・並べ替え
- **Bento**: 24 列グリッド上に商品・テキストを配置・リサイズ
- **商品**: タイトル、ブランド、価格（¥ / $）、画像、公式サイト URL
- **商品画像**: URL 指定、ファイルアップロード、クリップボード貼り付け。切り抜き（crop）対応。実体は Storage の `product-images`（ユーザー ID 配下）に保存し、キャンバス JSON には公開 URL を保持
- **公開 & シェア**: 固有 slug URL、動的 OGP、X シェア

### アカウント・上限

| 項目 | 内容 |
|------|------|
| ログイン | X（Twitter）OAuth |
| ユーザーID | 半角英数字と `_`、3〜24 文字。全体で一意。新規時は自動発行 |
| ディスプレイネーム | 表示名。40 文字以内 |
| プロフィール画像 | 正方形にトリミングし、Supabase Storage（`avatars`）に保存 |
| リスト上限 | 1 アカウントあたり **3** 件（DB トリガー + API） |
| スターター例示 | 初回一覧取得時に例示キャンバスを 1 度だけ付与。削除後は再付与しない |
| アカウント削除 | 商品画像・アバター Storage を掃除したうえで Auth ユーザーを削除 |

## ソース構成（概要）

```
src/
  app/                   # ルート・API・法務ページ
  components/canvas/     # エディタ UI（bento / blocks / hooks）
  components/dashboard/  # アカウント設定・削除
  data/example-canvas.json
  lib/bento/             # グリッド計算・配置操作・マイグレーション
  lib/canvas-service.ts
  lib/product-images.ts  # 商品画像 Storage
  lib/avatar-images.ts   # アバター Storage
  lib/example-canvas.ts
supabase/migrations/     # スキーマ・RLS・Storage
```

## Vercel デプロイ

1. GitHub にプッシュ
2. Vercel でインポート
3. 環境変数を設定（`NEXT_PUBLIC_APP_URL` は本番 URL に。アカウント削除を使うなら `SUPABASE_SERVICE_ROLE_KEY` も）
4. Supabase の Auth → URL Configuration に本番の `/auth/callback` を追加
5. マイグレーション（特に `005_product_images_storage.sql`）が本番プロジェクトでも適用済みであることを確認
