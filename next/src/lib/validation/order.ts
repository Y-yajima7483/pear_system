import * as yup from 'yup';
import type { AnyObjectSchema } from 'yup';

/**
 * 注文フォームのバリデーションスキーマ
 */
export const orderFormSchema:AnyObjectSchema = yup.object({
  customer_name: yup.string().required('お客様名は必須です').max(191, "191文字以内で入力してください"),
  notes: yup.string().nullable().max(300, "300文字以内で入力してください"),
  pickup_date: yup
    .mixed()
    .transform((v, ov) => (ov === '' ? null : v)) // 空文字はnullとして扱う
    .nullable()
    .test('is-valid-date', '不正な入力です', (v) => {
      if (v === null) return true;               // nullは許可
      return v instanceof Date && !isNaN(v.getTime());
    }),
  pickup_time: yup
    .string()
    .nullable()
    .test('is-valid-time', '不正な値です', function(value) {
      // null、undefined、空文字は許可
      if (!value || value === '') return true;

      // HH:mm形式をチェック
      const timeRegex = /^(\d{2}):(\d{2})$/;
      const match = value.match(timeRegex);
      if (!match) return false;

      const [, hourStr, minuteStr] = match;
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);

      // 時間部分と分部分が両方存在するかチェック
      if (isNaN(hour) || isNaN(minute)) return false;

      // 片方だけ入力されていないかチェック（UIの制約上、起こりにくいが念のため）
      if ((hour && !minuteStr) || (!hourStr && minute)) return false;

      // 有効な時間範囲かチェック（7-21時、0/15/30/45分）
      const validHours = hour >= 7 && hour <= 21;
      const validMinutes = [0, 15, 30, 45].includes(minute);

      return validHours && validMinutes;
    }),
  items: yup.array()
    .of(
      yup.object({
        variety_id: yup.string().required('品種を選択してください'),
        product: yup.lazy((value) => {
          const shape: any = {};
          if (value && typeof value === 'object') {
            Object.keys(value).forEach((productId) => {
              shape[productId] = yup.string()
                .required('数量を入力してください')
                .matches(/^\d+$/, '0以上の整数を入力してください')
                .test('non-negative', '0以上の整数を入力してください', (val) => {
                  if (!val) return true;
                  const num = parseInt(val);
                  return !isNaN(num) && num >= 0;
                });
            });
          }
          return yup.object().shape(shape);
        })
      })
    )
    .min(1, '少なくとも1つの品種を追加してください')
    .test('has-valid-items', '少なくとも1つの有効な注文が必要です', function(items) {
      if (!items || items.length === 0) return false;

      // 少なくとも1つの品種で、1つ以上の商品が0より大きい数量を持っているかチェック
      return items.some(item => {
        if (!item.variety_id || !item.product) return false;
        return Object.values(item.product).some(quantity => {
          const num = parseInt(quantity as string);
          return !isNaN(num) && num > 0;
        });
      });
    })
});
