# Visual Wishlist Canvas

代払い（決済・ギフト）機能を持たない、純粋な物欲・こだわり・関心のポートフォリオ共有ツール。

見出し・区切り線・Bento グリッドでドキュメントを組み立て、商品の画像・ブランド・価格・こだわりコメントを公開できます。

## 技術スタック

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4, shadcn/ui 風コンポーネント
- **Layout**: 縦ドキュメント + Bento グリッド（商品 / テキストを配置）
- **Backend / Database**: Supabase (PostgreSQL, Auth, RLS) またはローカル JSON
- **Deployment**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) で新規プロジェクトを作成
2. SQL Editor で `supabase/migrations/001_canvases.sql` を実行
3. Authentication → Providers で Email を有効化
4. （任意）X / Twitter ログインを使う場合は下記「X（Twitter）ログイン」を設定

### 3. ワンコマンドセットアップ（Windows）

```powershell
.\setup.ps1
npm run dev
```

http://localhost:3000/login を開き「はじめる」をクリック

> **Supabase 未設定でも使えます。** プレースホルダーのままならローカル開発モードが有効になり、データは `.data/` フォルダに保存されます。

### 4. 環境変数（Supabase 本番利用時）

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

### 5. X（Twitter）ログイン（任意）

メール／パスワードに加えて、Supabase の **X / Twitter (OAuth 2.0)** でログインできます。Client ID / Secret は Next.js の `.env` ではなく **Supabase Dashboard** に保存します。

1. [X Developer Portal](https://developer.x.com/) でアプリを作成し、OAuth 2.0 を有効化
2. Callback URL に `https://<project-ref>.supabase.co/auth/v1/callback` を登録（アプリの `localhost` ではない）
3. 可能なら「Request email from users」を有効化
4. Supabase Dashboard → Authentication → Providers → **X / Twitter (OAuth 2.0)** を ON にし、Client ID / Secret を貼り付け
5. Authentication → URL Configuration の Redirect URLs に `http://localhost:3000/auth/callback` と本番の `/auth/callback` を追加

設定後、`/login` の「Xでログイン」から認可フローが始まり、成功すると `/dashboard` に戻ります。

### 6. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 を開く

## 主要ルート

| パス | 説明 |
|------|------|
| `/` | ランディングページ |
| `/login` | ログイン / 新規登録 |
| `/dashboard` | マイキャンバス一覧 |
| `/edit/[id]` | キャンバス編集 |
| `/c/[slug]` | 公開閲覧ページ |
| `/api/canvases` | キャンバス CRUD API |

## コア機能

- **編集画面**: Bento・見出し・区切り線を縦に追加
- **Bento**: グリッド上に商品・テキストを配置・リサイズ
- **公開 & シェア**: 固有 slug URL、Twitter OGP 対応
- **決済なし**: 物欲・こだわりのポートフォリオに特化

## ソース構成（概要）

```
src/
  app/                 # ルート・API
  components/canvas/   # エディタ UI（bento / blocks / hooks）
  lib/bento/           # グリッド計算・配置操作・マイグレーション
  lib/canvas-service.ts
```

## Vercel デプロイ

1. GitHub にプッシュ
2. Vercel でインポート
3. 環境変数を設定（`NEXT_PUBLIC_APP_URL` は本番 URL に）
4. Supabase の Auth → URL Configuration に本番 URL を追加
