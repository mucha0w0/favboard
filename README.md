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

### 5. 開発サーバー起動

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
