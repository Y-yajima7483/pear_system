'use client';

import { useState, useMemo, useCallback } from 'react';
import { Control, FieldErrors, UseFormTrigger, useFieldArray, Controller } from 'react-hook-form';
import { X, Plus } from 'lucide-react';
import NumberStepperBase from '@/components/input/NumberStepperBase';
import SelectBoxBase from '@/components/input/SelectBoxBase';
import Button from '@/components/ui/Button';
import { useVarietyOptions } from '@/stores/useVarietyOptionStore';
import { useProductOptions } from '@/stores/useProductOptionStore';
import type { OptionType } from '@/types';
import type { ShipmentRecordFormInputs } from '@/types/shipmentRecord';

interface Props {
  control: Control<ShipmentRecordFormInputs>;
  errors: FieldErrors<ShipmentRecordFormInputs>;
  trigger: UseFormTrigger<ShipmentRecordFormInputs>;
}

export default function DirectSaleItems({ control, errors, trigger }: Props) {
  const varietyOptions = useVarietyOptions();
  const productOptions = useProductOptions();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'direct_sale_items',
  });

  // 追加済み品種IDリスト
  const [addedVarietyIds, setAddedVarietyIds] = useState<number[]>([]);
  // 品種セレクタの選択値
  const [selectedVarietyId, setSelectedVarietyId] = useState<string>('');
  // 非メイン商品セレクタの選択値（品種IDごと）
  const [selectedNonMainProductIds, setSelectedNonMainProductIds] = useState<Record<number, string>>({});

  // sku_suffixから初期玉数リストを取得（is_shipping商品のみ複数行）
  const getInitialFruitQuantities = useCallback((skuSuffix: string, isShipping: boolean): number[] => {
    if (!isShipping) return [0];
    if (skuSuffix.startsWith('5K')) return [10, 9, 8, 7];
    if (skuSuffix.startsWith('3K')) return [5, 6];
    return [0];
  }, []);

  // 品種セレクタ用オプション（追加済みを除外）
  const varietySelectOptions: OptionType[] = useMemo(
    () =>
      varietyOptions
        .filter((v) => !addedVarietyIds.includes(v.value))
        .map((v) => ({ label: v.label, value: v.value.toString() })),
    [varietyOptions, addedVarietyIds]
  );

  // 品種ごとの未追加・非メイン商品オプション
  const nonMainProductOptionsMap = useMemo(() => {
    const addedProductIds = new Set(fields.map((f) => f.product_id));
    const map = new Map<number, OptionType[]>();
    addedVarietyIds.forEach((varietyId) => {
      const opts = productOptions
        .filter((p) => p.variety === varietyId && !p.is_main && !addedProductIds.has(p.value.toString()))
        .map((p) => ({ label: p.label, value: p.value.toString() }));
      map.set(varietyId, opts);
    });
    return map;
  }, [productOptions, fields, addedVarietyIds]);

  // 品種追加
  const handleAddVariety = useCallback(() => {
    if (!selectedVarietyId) return;
    const varietyId = parseInt(selectedVarietyId);

    // 該当品種の商品一覧を取得してフィールドに追加
    const productsForVariety = productOptions.filter((p) => p.variety === varietyId && p.is_main);
    productsForVariety.forEach((product) => {
      const initialQuantities = getInitialFruitQuantities(product.sku_suffix, product.is_shipping);
      initialQuantities.forEach((qty) => {
        append({
          product_id: product.value.toString(),
          fruit_quantity: qty,
          box_quantity: 0,
        });
      });
    });

    setAddedVarietyIds((prev) => [...prev, varietyId]);
    setSelectedVarietyId('');
  }, [selectedVarietyId, productOptions, append, getInitialFruitQuantities]);

  // 非メイン商品追加
  const handleAddNonMainProduct = useCallback(
    (varietyId: number, productId: string) => {
      if (!productId) return;
      const product = productOptions.find((p) => p.value.toString() === productId);
      const initialQuantities = product
        ? getInitialFruitQuantities(product.sku_suffix, product.is_shipping)
        : [0];
      initialQuantities.forEach((qty) => {
        append({ product_id: productId, fruit_quantity: qty, box_quantity: 0 });
      });
      setSelectedNonMainProductIds((prev) => ({ ...prev, [varietyId]: '' }));
    },
    [append, productOptions, getInitialFruitQuantities]
  );

  // 品種削除
  const handleRemoveVariety = useCallback(
    (varietyId: number) => {
      // 該当品種の商品のproduct_idを取得
      const productIdsForVariety = new Set(
        productOptions.filter((p) => p.variety === varietyId).map((p) => p.value.toString())
      );

      // fieldsの中から該当商品のインデックスを降順で取得して削除
      const indicesToRemove = fields
        .map((field, index) => (productIdsForVariety.has(field.product_id) ? index : -1))
        .filter((i) => i !== -1)
        .reverse();

      indicesToRemove.forEach((index) => remove(index));
      setAddedVarietyIds((prev) => prev.filter((id) => id !== varietyId));
      setSelectedNonMainProductIds((prev) => {
        const next = { ...prev };
        delete next[varietyId];
        return next;
      });
    },
    [productOptions, fields, remove]
  );

  // 品種IDから品種名を取得
  const getVarietyName = useCallback(
    (varietyId: number) => varietyOptions.find((v) => v.value === varietyId)?.label ?? '',
    [varietyOptions]
  );

  // product_id → 商品名のマップ
  const productNameMap = useMemo(
    () => new Map(productOptions.map((p) => [p.value.toString(), p.label])),
    [productOptions]
  );

  // 品種ID → 商品グループのマップ（同一商品の複数行をグループ化）
  type ProductGroup = {
    productId: string;
    productName: string;
    rows: { fieldIndex: number }[];
  };

  const varietyProductGroupsMap = useMemo(() => {
    const map = new Map<number, ProductGroup[]>();
    const productVarietyMap = new Map(productOptions.map((p) => [p.value.toString(), p.variety]));

    fields.forEach((field, index) => {
      const varietyId = productVarietyMap.get(field.product_id);
      if (varietyId === undefined) return;
      if (!map.has(varietyId)) map.set(varietyId, []);

      const groups = map.get(varietyId)!;
      const existingGroup = groups.find((g) => g.productId === field.product_id);
      if (existingGroup) {
        existingGroup.rows.push({ fieldIndex: index });
      } else {
        groups.push({
          productId: field.product_id,
          productName: productNameMap.get(field.product_id) ?? '',
          rows: [{ fieldIndex: index }],
        });
      }
    });

    return map;
  }, [fields, productOptions, productNameMap]);

  // 行追加ハンドラー
  const handleAddRow = useCallback(
    (productId: string) => {
      append({
        product_id: productId,
        fruit_quantity: 0,
        box_quantity: 0,
      });
    },
    [append]
  );

  // 行削除ハンドラー
  const handleRemoveRow = useCallback(
    (fieldIndex: number) => {
      remove(fieldIndex);
    },
    [remove]
  );

  return (
    <div className="px-1">
      {/* セクション区切り */}
      <div className="ds-section-divider">品種別入力</div>

      {/* 品種追加行 */}
      <div className="ds-variety-add-row">
        <SelectBoxBase<ShipmentRecordFormInputs>
          name={'direct_sale_items' as any}
          inputLabel="品種を選択"
          option={varietySelectOptions}
          value={selectedVarietyId || null}
          onChange={(val) => setSelectedVarietyId(val ?? '')}
          disabledRemove
        />
        <Button
          type="button"
          onClick={handleAddVariety}
          outline
          disabled={!selectedVarietyId}
          className="!px-4 !py-2 !text-sm whitespace-nowrap"
        >
          + 品種を追加
        </Button>
      </div>

      {/* 品種カード */}
      {addedVarietyIds.length === 0 && (
        <div className="text-center text-gray-400 py-6 text-sm">
          品種を選択して「品種を追加」ボタンを押してください
        </div>
      )}

      {addedVarietyIds.map((varietyId) => {
        const productGroups = varietyProductGroupsMap.get(varietyId) ?? [];

        return (
          <div key={varietyId} className="ds-variety-card">
            {/* カードヘッダー */}
            <div className="ds-variety-card__header">
              <span className="ds-variety-card__title">
                {getVarietyName(varietyId)}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md
                  text-[var(--error)] border border-transparent hover:bg-[var(--error-bg)] transition-colors"
                onClick={() => handleRemoveVariety(varietyId)}
              >
                <X size={14} /> 品種削除
              </button>
            </div>

            {/* カラムヘッダー */}
            <div className="ds-column-headers">
              <span>商品名</span>
              <span style={{ textAlign: 'center' }}>玉数</span>
              <span style={{ textAlign: 'center' }}>箱/袋数</span>
              <span></span>
            </div>

            {/* 商品行 */}
            <div className="ds-variety-card__body">
              {productGroups.map((group) => (
                <div key={group.productId} className="ds-product-group">
                  {group.rows.map((row, rowIdx) => (
                    <div key={row.fieldIndex} className="ds-product-row">
                      <span className="ds-product-name">
                        {rowIdx === 0 ? group.productName : ''}
                      </span>
                      <div style={{ textAlign: 'center' }}>
                        <Controller
                          name={`direct_sale_items.${row.fieldIndex}.fruit_quantity`}
                          control={control}
                          render={({ field: f }) => (
                            <NumberStepperBase
                              name={`direct_sale_items.${row.fieldIndex}.fruit_quantity` as any}
                              value={f.value ?? 0}
                              onChange={f.onChange}
                              min={0}
                            />
                          )}
                        />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Controller
                          name={`direct_sale_items.${row.fieldIndex}.box_quantity`}
                          control={control}
                          render={({ field: f }) => (
                            <NumberStepperBase
                              name={`direct_sale_items.${row.fieldIndex}.box_quantity` as any}
                              value={f.value ?? 0}
                              onChange={f.onChange}
                              min={0}
                            />
                          )}
                        />
                      </div>
                      <div className="ds-row-actions">
                        {rowIdx === 0 ? (
                          <button
                            type="button"
                            className="ds-add-row-btn"
                            onClick={() => handleAddRow(group.productId)}
                            title="行を追加"
                          >
                            <Plus size={14} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="ds-remove-row-btn"
                            onClick={() => handleRemoveRow(row.fieldIndex)}
                            title="行を削除"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 非メイン商品追加 */}
            {(nonMainProductOptionsMap.get(varietyId) ?? []).length > 0 && (
              <div className="ds-non-main-add-row">
                <SelectBoxBase<ShipmentRecordFormInputs>
                  name={'direct_sale_items' as any}
                  inputLabel="商品を追加"
                  option={nonMainProductOptionsMap.get(varietyId) ?? []}
                  value={selectedNonMainProductIds[varietyId] || null}
                  onChange={(val) =>
                    setSelectedNonMainProductIds((prev) => ({ ...prev, [varietyId]: val ?? '' }))
                  }
                  disabledRemove
                />
                <Button
                  type="button"
                  outline
                  onClick={() => handleAddNonMainProduct(varietyId, selectedNonMainProductIds[varietyId])}
                  disabled={!selectedNonMainProductIds[varietyId]}
                  className="ds-non-main-add-btn"
                >
                  <Plus size={14} /> 追加
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
