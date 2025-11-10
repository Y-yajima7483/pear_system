# 動的タイトル・メタタグの使用方法

## 概要
共通レイアウトに動的なタイトルとメタタグの機能を追加しました。各ページで独自のタイトルとメタデータを設定できます。

## 実装内容

### 1. 型定義 (`next/src/types/metadata.ts`)
```typescript
export interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string;
}

export const defaultMetadata: PageMetadata = {
  title: 'PEAR System - 注文管理システム',
  description: '梨の注文・受取予約管理システム',
  keywords: '梨, 注文管理, 受取予約, PEAR',
};
```

### 2. 共通ヘッダーコンポーネント (`next/src/components/ui/page-header.tsx`)
- 画面上部に固定表示されるヘッダー
- システム全体のデザインと統一感のあるスタイル
- レスポンシブ対応

### 3. ルートレイアウト (`next/src/app/layout.tsx`)
- デフォルトのメタデータ設定
- OGP（Open Graph Protocol）対応
- Twitter Card対応
- ページヘッダーの統合

## 使用方法

### 各ページでメタデータを設定する

各ページやレイアウトファイルで以下のように`Metadata`をエクスポートします：

```typescript
// next/src/app/(authorized)/(pickup-reservations)/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "受取予約 - PEAR System",
  description: "梨の受取予約とスケジュール管理",
};

export default function PickupReservationsLayout({ children }) {
  return <>{children}</>;
}
```

### ページタイトルの設定例

1. **基本的な設定**
```typescript
export const metadata: Metadata = {
  title: "ページタイトル - PEAR System",
  description: "ページの説明文",
};
```

2. **詳細な設定（SEO対応）**
```typescript
export const metadata: Metadata = {
  title: "注文管理 - PEAR System",
  description: "梨の注文情報を管理するページです",
  keywords: "梨, 注文, 管理",
  openGraph: {
    title: "注文管理 - PEAR System",
    description: "梨の注文情報を管理するページです",
  },
};
```

## デザインについて

### ヘッダーのスタイル
- 固定ヘッダー（`sticky top-0`）で常に画面上部に表示
- システムカラー（`border-border-default`）を使用して統一感を維持
- シャドウ効果でコンテンツとの境界を明確化
- レスポンシブ対応（モバイル・タブレット・デスクトップ）

### カスタマイズ方法

ヘッダーのデザインをカスタマイズする場合は、`next/src/components/ui/page-header.tsx`を編集してください：

```typescript
export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="w-full border-b border-border-default bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            {title}
          </h1>
          {/* ここにロゴやナビゲーションを追加できます */}
        </div>
      </div>
    </header>
  );
}
```

## 既存のページへの適用例

### 受取予約ページ
- ファイル: `next/src/app/(authorized)/(pickup-reservations)/layout.tsx`
- タイトル: "受取予約 - PEAR System"

### ログインページ
- ファイル: `next/src/app/login/layout.tsx`
- タイトル: "ログイン - PEAR System"

## 注意点

1. **Next.js 15 のメタデータ API を使用**
   - `generateMetadata`関数で動的にメタデータを生成することも可能です

2. **階層的なメタデータの上書き**
   - 子レイアウトやページのメタデータは親を上書きします
   - ルートレイアウト → グループレイアウト → ページの順で適用されます

3. **環境変数**
   - `NEXT_PUBLIC_APP_URL`を設定すると、OGPのURLが正しく設定されます

## 今後の拡張案

- ページタイトルに基づくパンくずリスト
- ユーザー情報の表示（ログイン状態）
- ナビゲーションメニューの追加
- ダークモード対応
