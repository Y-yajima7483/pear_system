# OrderUpdateDialog 使用ガイド

## 概要
`OrderUpdateDialog`は既存の注文情報を編集するためのダイアログコンポーネントです。OrderRegisterDialogと同様のレイアウトで、渡された注文データを初期値として設定し、編集可能な状態で表示します。

## ファイル配置
- **ファイルパス**: `next/src/app/(authorized)/components/OrderUpdateDialog.tsx`
- **function名**: `OrderUpdateDialog`

## 特徴

✅ **初期値自動設定**: 渡された注文データがフォームに自動で反映されます
✅ **品種・商品の表示**: 品種別注文フォームが最初から展開された状態で表示されます
✅ **レイアウト統一**: OrderRegisterDialogと同じUIデザイン
✅ **バリデーション**: 既存のorderFormSchemaを使用した検証
✅ **カスタムトリガー**: 任意のボタンやリンクをトリガーに設定可能

## Props

```typescript
interface OrderUpdateDialogProps {
  orderData: OrderDetailData;      // 編集対象の注文データ（必須）
  onOrderUpdated?: () => void;     // 更新成功時のコールバック（任意）
  trigger?: React.ReactNode;       // カスタムトリガー要素（任意）
}
```

### `orderData` の型定義

```typescript
interface OrderDetailData {
  id: number;
  customer_name: string;
  notes: string;
  pickup_date: string | null;
  pickup_time: string | null;
  status: 'pending' | 'picked_up' | 'canceled';
  items: Array<{
    variety_id: number;
    variety_name: string;
    products: Array<{
      product_id: number;
      product_name: string;
      quantity: number;
    }>;
  }>;
}
```

## 基本的な使用方法

### 1. デフォルトトリガーを使用する場合

```tsx
import OrderUpdateDialog from '@/app/(authorized)/components/OrderUpdateDialog';

function OrderDetailPage() {
  const orderData: OrderDetailData = {
    id: 1,
    customer_name: '山田太郎',
    notes: '午前中の受け取り希望',
    pickup_date: '2025-10-15',
    pickup_time: '10:00',
    status: 'pending',
    items: [
      {
        variety_id: 1,
        variety_name: '豊水',
        products: [
          { product_id: 1, product_name: '豊水 5kg', quantity: 2 },
          { product_id: 2, product_name: '豊水 10kg', quantity: 1 },
        ],
      },
      {
        variety_id: 2,
        variety_name: '幸水',
        products: [
          { product_id: 5, product_name: '幸水 5kg', quantity: 3 },
        ],
      },
    ],
  };

  const handleOrderUpdated = () => {
    console.log('注文が更新されました');
    // データの再取得などの処理
  };

  return (
    <div>
      <OrderUpdateDialog
        orderData={orderData}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
}
```

### 2. カスタムトリガーを使用する場合

```tsx
import OrderUpdateDialog from '@/app/(authorized)/components/OrderUpdateDialog';
import { PencilIcon } from 'lucide-react';

function OrderListItem({ order }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded">
      <div>
        <h3>{order.customer_name}</h3>
        <p>{order.pickup_date}</p>
      </div>

      <OrderUpdateDialog
        orderData={order}
        onOrderUpdated={() => {
          // 注文リストを再取得
          refetchOrders();
        }}
        trigger={
          <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded">
            <PencilIcon className="w-4 h-4" />
            編集
          </button>
        }
      />
    </div>
  );
}
```

### 3. テーブル内で使用する場合

```tsx
import OrderUpdateDialog from '@/app/(authorized)/components/OrderUpdateDialog';

function OrderTable({ orders }) {
  return (
    <table>
      <thead>
        <tr>
          <th>お客様名</th>
          <th>受取日</th>
          <th>ステータス</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>{order.customer_name}</td>
            <td>{order.pickup_date}</td>
            <td>{order.status}</td>
            <td>
              <OrderUpdateDialog
                orderData={order}
                onOrderUpdated={() => refetchOrders()}
                trigger={
                  <button className="text-sm text-blue-600 underline">
                    編集
                  </button>
                }
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## 実装の詳細

### データ変換処理

コンポーネント内部で、APIから受け取った注文データをReact Hook Formで扱える形式に変換します：

```typescript
const convertOrderDataToFormValues = (data: OrderDetailData): OrderFormInputs => {
  const items: ItemValueType[] = data.items.map(item => {
    const product: { [key: string]: string } = {};
    item.products.forEach(p => {
      product[p.product_id.toString()] = p.quantity.toString();
    });

    return {
      variety_id: item.variety_id.toString(),
      product,
    };
  });

  return {
    customer_name: data.customer_name,
    notes: data.notes || '',
    pickup_date: data.pickup_date || '',
    pickup_time: data.pickup_time || '',
    items,
  };
};
```

### フォームの初期化

ダイアログが開かれるたびに、最新の注文データでフォームをリセットします：

```typescript
useEffect(() => {
  if (open) {
    reset(convertOrderDataToFormValues(orderData));
  }
}, [open, orderData, reset]);
```

### 更新APIリクエスト

```typescript
const onSubmit = async(data: OrderFormInputs) => {
  // データ整形処理...

  const res = await put(`/order/${orderData.id}`, {
    customer_name: data.customer_name,
    notes: data.notes,
    pickup_date: data.pickup_date ? format(data.pickup_date, 'yyyy-MM-dd') : null,
    pickup_time: data.pickup_time ? data.pickup_time : null,
    items: orderItem
  });

  if(res.success) {
    setOpen(false);
    if (onOrderUpdated) {
      onOrderUpdated();
    }
  }
};
```

## OrderRegisterDialog との違い

| 項目 | OrderRegisterDialog | OrderUpdateDialog |
|------|-------------------|-------------------|
| **目的** | 新規注文登録 | 既存注文編集 |
| **初期値** | 空のフォーム | 注文データが入力済み |
| **品種フォーム** | 非表示（追加ボタンで表示） | 最初から表示済み |
| **API** | POST /order | PUT /order/:id |
| **トリガー** | 固定（「新しい注文を登録する」ボタン） | カスタマイズ可能 |
| **Props** | onOrderCreated のみ | orderData, onOrderUpdated, trigger |

## 注意点

1. **orderData の必須性**
   - `orderData` は必須プロパティです
   - データが不完全な場合はバリデーションエラーが発生する可能性があります

2. **日付フォーマット**
   - `pickup_date` は 'yyyy-MM-dd' 形式の文字列で渡してください
   - `pickup_time` は 'HH:mm' 形式の文字列で渡してください

3. **品種・商品の関連**
   - 品種に紐づく商品が存在しない場合、フォームに表示されません
   - 商品マスタが更新されている場合、表示される商品も変わります

4. **ダイアログの状態管理**
   - ダイアログを開くたびにフォームがリセットされます
   - 編集中にダイアログを閉じると変更は破棄されます

## トラブルシューティング

### Q1: フォームに値が表示されない
**A**: orderDataの構造が正しいか確認してください。特に`items`配列の構造に注意してください。

### Q2: バリデーションエラーが発生する
**A**: orderFormSchemaの検証ルールを確認してください。特に必須項目や数値の範囲に注意してください。

### Q3: 更新が反映されない
**A**: `onOrderUpdated`コールバックでデータの再取得を行っているか確認してください。

## 今後の拡張案

- ステータス変更機能の追加
- 履歴表示機能
- 編集権限のチェック
- 楽観的UI更新
- エラーハンドリングの強化
