import { SKU_SUFFIX } from './product';

/** 等級IDの定数値 (バックエンド grades テーブルと同期) */
export const GRADE_ID = {
  SHU: 1,                 // 秀
  YU: 2,                  // 優
  RYO: 3,                 // 良
  KIKAKUGAI_SALES: 4,     // 規格外(販売)
  KIKAKUGAI_NON_SALES: 5, // 規格外(非販売)
  LOSS: 6,                // ロス
  PRESENT: 7,             // プレゼント
} as const;

export type GradeIdValue = (typeof GRADE_ID)[keyof typeof GRADE_ID];

/** SKUサフィックスから等級IDへのマッピング */
const SKU_SUFFIX_GRADE_MAP: Partial<Record<string, GradeIdValue>> = {
  [SKU_SUFFIX.WBAG]: GRADE_ID.KIKAKUGAI_SALES,
};

/** SKUサフィックスから等級IDを取得（デフォルト: 秀） */
export const getGradeIdBySku = (skuSuffix: string): number => {
  return SKU_SUFFIX_GRADE_MAP[skuSuffix] ?? GRADE_ID.SHU;
};
