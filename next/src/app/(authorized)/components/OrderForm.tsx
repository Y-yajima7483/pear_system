'use client';

import { useEffect, useMemo } from 'react'
import { Control, FieldErrors, UseFormTrigger, UseFormWatch, UseFormSetValue, UseFieldArrayReturn } from 'react-hook-form'
import TextField from '@/components/input/TextField'
import TextArea from '@/components/input/TextArea';
import TimeSelect from '@/components/input/TimeSelect';
import DatePicker from '@/components/input/DatePicker';
import SelectBox from '@/components/input/SelectBox';
import Button from "@/components/ui/Button";
import { useVarietyOptionStore } from '@/stores/useVarietyOptionStore'
import { useProductOptionStore } from '@/stores/useProductOptionStore'
import type { OptionType } from '@/types/index'

// フォーム入力値の型定義
export interface ItemValueType {
  variety_id: string; // 品種ID（SelectBoxはstring型で扱う）
  product: {
    [product_id: string]: string; // 商品ID: 数量（入力値はstring型）
  };
}

// 注文登録フォーム型
export interface OrderFormInputs {
  customer_name: string; // お客様名
  notes: string; // 備考
  pickup_date: string;
  pickup_time: string;
  items: Array<ItemValueType> // 複数品種の配列
}

// 商品デフォルト値
export const itemDefaultValues: ItemValueType = { variety_id: '', product: {} };

interface OrderFormProps {
  control: Control<OrderFormInputs>;
  errors: FieldErrors<OrderFormInputs>;
  trigger: UseFormTrigger<OrderFormInputs>;
  watch: UseFormWatch<OrderFormInputs>;
  setValue: UseFormSetValue<OrderFormInputs>;
  fieldArray: UseFieldArrayReturn<OrderFormInputs, 'items', 'id'>;
}

export default function OrderForm({
  control,
  errors,
  trigger,
  watch,
  setValue,
  fieldArray
}: OrderFormProps) {
  const { varietyOptions } = useVarietyOptionStore()
  const { productOptions } = useProductOptionStore()

  const { fields, append, remove } = fieldArray;

  // 品種オプションをSelectBox用に変換
  const varietySelectOptions: OptionType[] = useMemo(() =>
    varietyOptions.map(option => ({
      label: option.label,
      value: option.value.toString(),
    })),
    [varietyOptions]
  )

  // 各品種に紐づく商品を取得する関数
  const getProductsByVariety = (variety_id: string) => {
    if (!variety_id) return []
    const numericVarietyId = parseInt(variety_id)
    return productOptions.filter(product => product.variety === numericVarietyId)
  }

  // 品種追加ハンドラ
  const handleAddVariety = () => {
    append(itemDefaultValues)
  }

  // 品種選択変更の監視
  const watchedVarieties = watch('items')
  useEffect(() => {
    if (watchedVarieties) {
      watchedVarieties.forEach((variety, index) => {
        if (variety.variety_id) {
          const products = getProductsByVariety(variety.variety_id)
          const currentProducts = variety.product || {}

          // 品種に紐づく商品がある場合のみ処理
          if (products.length > 0) {
            const productIds = products.map(p => p.value.toString())

            // 新しく追加された商品のみに初期値'0'を設定
            const updatedProducts = { ...currentProducts }
            products.forEach((product) => {
              const productKey = product.value.toString()
              // 既存の値がない場合のみ'0'を設定
              if (updatedProducts[productKey] === undefined) {
                updatedProducts[productKey] = '0'
              }
            })

            // 選択されていない商品のデータは削除
            Object.keys(updatedProducts).forEach(key => {
              if (!productIds.includes(key)) {
                delete updatedProducts[key]
              }
            })

            if (JSON.stringify(currentProducts) !== JSON.stringify(updatedProducts)) {
              setValue(`items.${index}.product`, updatedProducts)
            }
          }
        } else {
          // 品種が選択されていない場合は空のオブジェクトを設定
          if (Object.keys(variety.product || {}).length > 0) {
            setValue(`items.${index}.product`, {})
          }
        }
      })
    }
  }, [watchedVarieties, productOptions, setValue]);

  return (
    <div className="form-area space-y-10 p-4">
      {/* 基本情報 */}
      <div className="flex flex-col">
        <TextField
          control={control}
          name="customer_name"
          inputLabel="お客様名"
          trigger={trigger}
          errorMessage={errors.customer_name?.message}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-6">
          <DatePicker
            control={control}
            name="pickup_date"
            inputLabel="受取日"
            trigger={trigger}
            errorMessage={errors.pickup_date?.message}
          />
          <TimeSelect
            control={control}
            name="pickup_time"
            errorMessage={errors.pickup_time?.message}
            trigger={trigger}
          />
        </div>
      </div>

      {/* 品種別注文 */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">品種別注文</h3>
          <Button type="button" onClick={handleAddVariety} className="!px-4 !py-2 !text-sm">
            品種を追加
          </Button>
        </div>
        {/* items全体のエラーメッセージ */}
        {errors.items?.root?.message && (
          <p className="text-sm text-red-500">{errors.items.root.message}</p>
        )}

        {fields.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            「品種を追加」ボタンから注文する品種を追加してください
          </div>
        )}

        {fields.map((field, index) => {
          const selectedVarietyId = watch(`items.${index}.variety_id`)
          const products = getProductsByVariety(selectedVarietyId)

          return (
            <div key={field.id} className="border rounded-lg py-8 px-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1">
                  <SelectBox
                    control={control}
                    name={`items.${index}.variety_id` as const}
                    inputLabel="品種を選択"
                    option={varietySelectOptions}
                    trigger={trigger}
                    errorMessage={errors.items?.[index]?.variety_id?.message}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => remove(index)}
                  color="alert"
                  outline
                  className="ml-2 !px-3 !py-1 !text-sm"
                >
                  削除
                </Button>
              </div>

              {selectedVarietyId && products.length > 0 && (
                <div className="space-y-6">
                  <h4 className="font-medium mb-8">商品別注文数</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-14 gap-x-4">
                    {products.map((product) => (
                      <TextField
                        key={product.value}
                        control={control}
                        name={`items.${index}.product.${product.value}` as const}
                        inputLabel={product.label}
                        type="number"
                        trigger={trigger}
                        defaultValue={"0"}
                        suffix='個'
                        errorMessage={errors.items?.[index]?.product?.[product.value.toString()]?.message}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 備考 */}
      <TextArea
        control={control}
        name="notes"
        inputLabel="備考"
        trigger={trigger}
        errorMessage={errors.notes?.message}
      />
    </div>
  )
}
