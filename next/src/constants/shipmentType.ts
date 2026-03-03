import type { ShipmentTypeApiOptionType } from '@/types';

/** 出荷種別の定数値 (バックエンド ShipmentTypeEnum と同期) */
export const SHIPMENT_TYPE = {
  DIRECT: 1,
  JA: 2,
} as const;

export type ShipmentTypeValue = (typeof SHIPMENT_TYPE)[keyof typeof SHIPMENT_TYPE];

/** 出荷種別オプション一覧（旧APIレスポンスと同一形状） */
export const SHIPMENT_TYPE_OPTIONS: ShipmentTypeApiOptionType[] = [
  { value: SHIPMENT_TYPE.DIRECT, label: '直売', has_direct_sale_items: true },
  { value: SHIPMENT_TYPE.JA, label: 'JA出荷', has_direct_sale_items: false },
];
