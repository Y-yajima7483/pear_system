import * as yup from 'yup';
import { isMatch } from 'date-fns';

const validNonNegativeInteger = yup
  .number()
  .integer('0以上の整数を入力してください')
  .min(0, '0以上の整数を入力してください')
  .required('0以上の整数を入力してください');

const directSaleItemSchema = yup.object({
  variety_id: yup.string().optional(),
  product_id: yup.string().required('商品を選択してください'),
  fruit_quantity: validNonNegativeInteger.required('玉数を入力してください'),
  box_quantity: validNonNegativeInteger.required('箱/袋数を入力してください'),
});

const manualGradeEntrySchema = yup.object({
  variety_id: yup.string().required('品種を選択してください'),
  grade_id: yup.string().required('等級を選択してください'),
  quantity: validNonNegativeInteger.required('商品外数量を入力してください'),
});

/**
 * 直売出荷登録フォームのバリデーションスキーマ
 */
export const directSaleFormSchema = yup.object({
  record_date: yup
    .mixed<Date | string>()
    .required('記録日は必須です')
    .test('is-valid-date', '不正な日付です', (v) => {
      if (v instanceof Date) {
        return !Number.isNaN(v.getTime());
      }

      return typeof v === 'string' && isMatch(v, 'yyyy-MM-dd');
    }),
  notes: yup.string().nullable().max(1000, '1000文字以内で入力してください'),
  direct_sale_items: yup.array().of(directSaleItemSchema).required(),
  manual_grade_entries: yup.array().of(manualGradeEntrySchema).required(),
}).test('has-any-quantity', '商品明細または商品外数量を1件以上入力してください', function (values) {
  const hasProductQuantity = values.direct_sale_items.some(
    (item) => Boolean(item.product_id) && item.box_quantity > 0
  );
  const hasManualQuantity = values.manual_grade_entries.some((entry) => entry.quantity > 0);

  if (hasProductQuantity || hasManualQuantity) {
    return true;
  }

  return this.createError({
    path: 'manual_grade_entries',
    message: '商品明細または商品外数量を1件以上入力してください',
  });
});
