import * as yup from 'yup';
import type { AnyObjectSchema } from 'yup';

/**
 * 出荷記録フォームのバリデーションスキーマ
 */
export const shipmentRecordFormSchema: AnyObjectSchema = yup.object({
  record_date: yup
    .mixed()
    .required('記録日は必須です')
    .test('is-valid-date', '不正な日付です', (v) => {
      return v instanceof Date && !isNaN(v.getTime());
    }),
  notes: yup.string().nullable().max(1000, '1000文字以内で入力してください'),
  tabs: yup.array().of(
    yup.object({
      shipment_type_id: yup.number().required(),
      varieties: yup.array().of(
        yup.object({
          variety_id: yup.string().required('品種を選択してください'),
          grades: yup.lazy((value) => {
            const shape: any = {};
            if (value && typeof value === 'object') {
              Object.keys(value).forEach((gradeId) => {
                shape[gradeId] = yup.number()
                  .integer('0以上の整数を入力してください')
                  .min(0, '0以上の整数を入力してください')
                  .required('数量を入力してください');
              });
            }
            return yup.object().shape(shape);
          }),
        })
      ),
    })
  ).test('has-any-quantity', '少なくとも1つの出荷数量を入力してください', function (tabs) {
    if (!tabs || tabs.length === 0) return true;

    // 等級ベースのエントリチェック（既存）
    const hasGradeEntries = tabs.some((tab) => {
      if (!tab.varieties || tab.varieties.length === 0) return false;
      return tab.varieties.some((variety) => {
        if (!variety.variety_id || !variety.grades) return false;
        return Object.values(variety.grades).some(
          (qty) => typeof qty === 'number' && qty > 0
        );
      });
    });

    // 直売商品のチェック（追加）
    const directSaleItems = this.parent.direct_sale_items;
    const hasDirectSaleEntries = directSaleItems?.some(
      (item: any) => item.product_id && (item.fruit_quantity > 0 || item.box_quantity > 0)
    );

    return hasGradeEntries || hasDirectSaleEntries;
  }),
  direct_sale_items: yup.array().of(
    yup.object({
      product_id: yup.string().required('商品を選択してください'),
      fruit_quantity: yup.number()
        .integer('0以上の整数を入力してください')
        .min(0, '0以上の整数を入力してください')
        .required('玉数を入力してください'),
      box_quantity: yup.number()
        .integer('0以上の整数を入力してください')
        .min(0, '0以上の整数を入力してください')
        .required('箱/袋数を入力してください'),
    })
  ).nullable(),
});
