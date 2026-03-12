/** SKUサフィックスの定数値 (バックエンド products テーブルと同期) */
export const SKU_SUFFIX = {
  THREE_KG_L: '3KL',  // 3キロ箱
  FIVE_KG_L: '5KL',   // 5キロ箱大玉
  FIVE_KG_M: '5KM',   // 5キロ箱中玉
  TEN_KG_L: '10KL',   // 10キロ箱大玉
  TEN_KG_M: '10KM',   // 10キロ箱中玉
  WBAG: 'WBAG',       // 訳あり袋
  BAG: 'BAG',         // 袋
} as const;

export type SkuSuffixValue = (typeof SKU_SUFFIX)[keyof typeof SKU_SUFFIX];
