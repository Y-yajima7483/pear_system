'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Control, FieldErrors, FieldPath, useFieldArray, Controller } from 'react-hook-form';
import { X, Plus } from 'lucide-react';
import NumberStepperBase from '@/components/input/NumberStepperBase';
import SelectBoxBase from '@/components/input/SelectBoxBase';
import Button from '@/components/ui/Button';
import { useVarietyOptions } from '@/stores/useVarietyOptionStore';
import { useProductOptions } from '@/stores/useProductOptionStore';
import { SKU_SUFFIX } from '@/constants/product';
import type { OptionType, ProductApiOptionType } from '@/types';
import type { DirectSaleFormInputs } from '@/types/shipmentRecord';

interface Props {
  control: Control<DirectSaleFormInputs>;
  errors: FieldErrors<DirectSaleFormInputs>;
}

export default function DirectSaleItems({ control, errors }: Props) {
  const varietyOptions = useVarietyOptions();
  const productOptions = useProductOptions();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'direct_sale_items',
  });

  // 品種セレクタの選択値
  const [selectedVarietyId, setSelectedVarietyId] = useState<string>('');
  // 非メイン商品セレクタの選択値（品種IDごと）
  const [selectedNonMainProductIds, setSelectedNonMainProductIds] = useState<Record<number, string>>({});

  // sku_suffixから初期玉数リストを取得（is_shipping商品のみ複数行）
  const getInitialFruitQuantities = useCallback((skuSuffix: string, isShipping: boolean): number[] => {
    if (!isShipping) return [0];
    if (skuSuffix === SKU_SUFFIX.FIVE_KG_L || skuSuffix === SKU_SUFFIX.FIVE_KG_M) return [10, 9, 8, 7];
    if (skuSuffix === SKU_SUFFIX.THREE_KG_L) return [5, 6];
    return [0];
  }, []);

  const productById = useMemo(
    () => new Map(productOptions.map((product) => [product.value.toString(), product])),
    [productOptions]
  );

  const varietyNameById = useMemo(
    () => new Map(varietyOptions.map((variety) => [variety.value, variety.label])),
    [varietyOptions]
  );

  const productsByVariety = useMemo(() => {
    const map = new Map<number, ProductApiOptionType[]>();

    productOptions.forEach((product) => {
      const products = map.get(product.variety);
      if (products) {
        products.push(product);
        return;
      }

      map.set(product.variety, [product]);
    });

    return map;
  }, [productOptions]);

  const addedVarietyIds = useMemo(() => {
    const ids: number[] = [];
    const seen = new Set<number>();

    fields.forEach((field) => {
      const varietyId = productById.get(field.product_id)?.variety;
      if (varietyId === undefined || seen.has(varietyId)) {
        return;
      }

      seen.add(varietyId);
      ids.push(varietyId);
    });

    return ids;
  }, [fields, productById]);

  useEffect(() => {
    setSelectedNonMainProductIds((prev) => {
      const activeVarietyIds = new Set(addedVarietyIds);
      const nextEntries = Object.entries(prev).filter(([varietyId]) => activeVarietyIds.has(Number(varietyId)));

      if (nextEntries.length === Object.keys(prev).length) {
        return prev;
      }

      return Object.fromEntries(nextEntries);
    });
  }, [addedVarietyIds]);

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
      const opts = (productsByVariety.get(varietyId) ?? [])
        .filter((p) => !p.is_main && !addedProductIds.has(p.value.toString()))
        .map((p) => ({ label: p.label, value: p.value.toString() }));
      map.set(varietyId, opts);
    });

    return map;
  }, [productsByVariety, fields, addedVarietyIds]);

  // 品種追加
  const handleAddVariety = useCallback(() => {
    if (!selectedVarietyId) return;
    const varietyId = Number(selectedVarietyId);

    // 該当品種の商品一覧を取得してフィールドに追加
    const productsForVariety = (productsByVariety.get(varietyId) ?? []).filter((product) => product.is_main);
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

    setSelectedVarietyId('');
  }, [selectedVarietyId, productsByVariety, append, getInitialFruitQuantities]);

  // 非メイン商品追加
  const handleAddNonMainProduct = useCallback(
    (varietyId: number, productId: string) => {
      if (!productId) return;
      const product = productById.get(productId);
      const initialQuantities = product
        ? getInitialFruitQuantities(product.sku_suffix, product.is_shipping)
        : [0];
      initialQuantities.forEach((qty) => {
        append({ product_id: productId, fruit_quantity: qty, box_quantity: 0 });
      });
      setSelectedNonMainProductIds((prev) => ({ ...prev, [varietyId]: '' }));
    },
    [append, productById, getInitialFruitQuantities]
  );

  // 品種削除
  const handleRemoveVariety = useCallback(
    (varietyId: number) => {
      const productIdsForVariety = new Set(
        (productsByVariety.get(varietyId) ?? []).map((product) => product.value.toString())
      );

      // fieldsの中から該当商品のインデックスを降順で取得して削除
      const indicesToRemove = fields
        .map((field, index) => (productIdsForVariety.has(field.product_id) ? index : -1))
        .filter((i) => i !== -1)
        .reverse();

      indicesToRemove.forEach((index) => remove(index));
      setSelectedNonMainProductIds((prev) => {
        const next = { ...prev };
        delete next[varietyId];
        return next;
      });
    },
    [productsByVariety, fields, remove]
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
    rows: { fieldIndex: number; fieldId: string }[];
  };

  const varietyProductGroupsMap = useMemo(() => {
    const map = new Map<number, Map<string, ProductGroup>>();

    fields.forEach((field, index) => {
      const product = productById.get(field.product_id);
      if (!product) {
        return;
      }

      let groups = map.get(product.variety);
      if (!groups) {
        groups = new Map<string, ProductGroup>();
        map.set(product.variety, groups);
      }

      const existingGroup = groups.get(field.product_id);
      if (existingGroup) {
        existingGroup.rows.push({ fieldIndex: index, fieldId: field.id });
        return;
      }

      groups.set(field.product_id, {
        productId: field.product_id,
        productName: productNameMap.get(field.product_id) ?? '',
        rows: [{ fieldIndex: index, fieldId: field.id }],
      });
    });

    return new Map(
      Array.from(map.entries()).map(([varietyId, groups]) => [varietyId, Array.from(groups.values())])
    );
  }, [fields, productById, productNameMap]);

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
        <SelectBoxBase<DirectSaleFormInputs>
          name={'direct_sale_items'}
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

      {/* 配列レベルエラー */}
      {(errors.direct_sale_items?.root?.message || errors.direct_sale_items?.message) && (
        <p className="text-sm text-[var(--error)] mt-2">
          {errors.direct_sale_items?.root?.message || errors.direct_sale_items?.message}
        </p>
      )}

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
                {varietyNameById.get(varietyId) ?? ''}
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
                    <div key={row.fieldId} className="ds-product-row">
                      <span className="ds-product-name">
                        {rowIdx === 0 ? group.productName : ''}
                      </span>
                      <div style={{ textAlign: 'center' }}>
                        <Controller
                          name={`direct_sale_items.${row.fieldIndex}.fruit_quantity`}
                          control={control}
                          render={({ field: f }) => (
                            <NumberStepperBase
                              name={`direct_sale_items.${row.fieldIndex}.fruit_quantity` as FieldPath<DirectSaleFormInputs>}
                              value={f.value ?? 0}
                              onChange={f.onChange}
                              min={0}
                              errorMessage={errors.direct_sale_items?.[row.fieldIndex]?.fruit_quantity?.message}
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
                              name={`direct_sale_items.${row.fieldIndex}.box_quantity` as FieldPath<DirectSaleFormInputs>}
                              value={f.value ?? 0}
                              onChange={f.onChange}
                              min={0}
                              errorMessage={errors.direct_sale_items?.[row.fieldIndex]?.box_quantity?.message}
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
                <SelectBoxBase<DirectSaleFormInputs>
                  name={'direct_sale_items'}
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
