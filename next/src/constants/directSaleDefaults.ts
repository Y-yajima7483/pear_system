import { SKU_SUFFIX } from './product';

/**
 * 直売入力フォームで品種追加時に自動生成する初期行の玉数リスト
 *
 * 箱のサイズごとに実際によく使う玉数の代表値を初期行として並べる（あくまで入力の目安。
 * ユーザーは玉数の変更・行の追加/削除を自由に行える）:
 * - 5キロ箱（大玉/中玉）: 10玉/9玉/8玉/7玉 の4パターンが定番
 * - 3キロ箱: 5玉/6玉 の2パターンが定番
 * - その他（袋等）: 玉数0の1行のみ生成し、都度入力してもらう
 */
export const INITIAL_FRUIT_QUANTITIES: Partial<Record<string, number[]>> = {
  [SKU_SUFFIX.FIVE_KG_L]: [10, 9, 8, 7],
  [SKU_SUFFIX.FIVE_KG_M]: [10, 9, 8, 7],
  [SKU_SUFFIX.THREE_KG_L]: [5, 6],
};

/**
 * SKUサフィックスから初期玉数リストを取得する
 * 配送対象外の商品（袋・訳あり袋）は玉数固定パターンがないため1行のみ
 */
export const getInitialFruitQuantities = (skuSuffix: string, isShipping: boolean): number[] => {
  if (!isShipping) return [0];

  return INITIAL_FRUIT_QUANTITIES[skuSuffix] ?? [0];
};
