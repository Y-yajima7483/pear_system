import * as yup from 'yup';

/**
 * JA出荷一括登録: データ読み込み条件のバリデーションスキーマ
 */
export const jaLoadConditionsSchema = yup.object({
  start_date: yup
    .date()
    .typeError('開始日を選択してください')
    .required('開始日を選択してください'),
  end_date: yup
    .date()
    .typeError('終了日を選択してください')
    .required('終了日を選択してください')
    .min(yup.ref('start_date'), '終了日は開始日以降の日付を指定してください'),
  variety_id: yup.string().required('品種を選択してください'),
});

export type JaLoadConditionErrors = Partial<
  Record<'start_date' | 'end_date' | 'variety_id', string>
>;

/**
 * 条件を検証し、フィールド別エラーを返す（エラーなしなら null）
 */
export const validateJaLoadConditions = async (values: {
  start_date: Date | null;
  end_date: Date | null;
  variety_id: string | null;
}): Promise<JaLoadConditionErrors | null> => {
  try {
    await jaLoadConditionsSchema.validate(values, { abortEarly: false });
    return null;
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errors: JaLoadConditionErrors = {};
      err.inner.forEach((e) => {
        if (e.path && !(e.path in errors)) {
          errors[e.path as keyof JaLoadConditionErrors] = e.message;
        }
      });
      return errors;
    }
    throw err;
  }
};
