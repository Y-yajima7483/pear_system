import * as yup from 'yup';

const validNonNegativeInteger = yup
  .number()
  .integer('0以上の整数を入力してください')
  .min(0, '0以上の整数を入力してください')
  .required('0以上の整数を入力してください');

const directSaleItemSchema = yup.object({
  product_id: yup.string().required('商品を選択してください'),
  fruit_quantity: validNonNegativeInteger.required('玉数を入力してください'),
  box_quantity: validNonNegativeInteger.required('箱/袋数を入力してください'),
});

/**
 * 直売出荷登録フォームのバリデーションスキーマ
 */
export const directSaleFormSchema = yup.object({
  record_date: yup
    .mixed()
    .required('記録日は必須です')
    .test('is-valid-date', '不正な日付です', (v) => {
      return v instanceof Date && !isNaN(v.getTime());
    }),
  notes: yup.string().nullable().max(1000, '1000文字以内で入力してください'),
  direct_sale_items: yup.array().of(directSaleItemSchema).test('has-any-quantity', '少なくとも1つの箱/袋数を入力してください', function (items) {
    return items?.some(
      (item: { product_id?: string; box_quantity?: number }) => item.product_id && (item.box_quantity ?? 0) > 0
    ) ?? false;
  }),
});

/**
 * 旧スキーマ（後方互換）
 */
export const shipmentRecordFormSchema = directSaleFormSchema;
