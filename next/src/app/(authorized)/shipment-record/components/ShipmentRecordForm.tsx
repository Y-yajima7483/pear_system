'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Control,
  FieldErrors,
  UseFormTrigger,
  UseFormWatch,
  UseFormSetValue,
  useFieldArray,
  Controller,
} from 'react-hook-form';
import SelectBoxBase from '@/components/input/SelectBoxBase';
import TextArea from '@/components/input/TextArea';
import Button from '@/components/ui/Button';
import { X } from 'lucide-react';
import DirectSaleItems from './DirectSaleItems';
import { useVarietyOptions } from '@/stores/useVarietyOptionStore';
import { useGradeOptions } from '@/stores/useGradeOptionStore';
import { SHIPMENT_TYPE, SHIPMENT_TYPE_OPTIONS } from '@/constants/shipmentType';
import type { OptionType, ShipmentTypeApiOptionType } from '@/types';
import type { ShipmentRecordFormInputs } from '@/types/shipmentRecord';

interface ShipmentRecordFormProps {
  control: Control<ShipmentRecordFormInputs>;
  errors: FieldErrors<ShipmentRecordFormInputs>;
  trigger: UseFormTrigger<ShipmentRecordFormInputs>;
  watch: UseFormWatch<ShipmentRecordFormInputs>;
  setValue: UseFormSetValue<ShipmentRecordFormInputs>;
}

// タブパネルのサブコンポーネント（useFieldArrayをhooksルールに従い使用するため）
interface TabPanelProps {
  tabIndex: number;
  shipmentType: ShipmentTypeApiOptionType;
  isActive: boolean;
  control: Control<ShipmentRecordFormInputs>;
  errors: FieldErrors<ShipmentRecordFormInputs>;
  trigger: UseFormTrigger<ShipmentRecordFormInputs>;
  watch: UseFormWatch<ShipmentRecordFormInputs>;
  setValue: UseFormSetValue<ShipmentRecordFormInputs>;
}

function TabPanel({
  tabIndex,
  shipmentType,
  isActive,
  control,
  errors,
  trigger,
  watch,
  setValue,
}: TabPanelProps) {
  const varietyOptions = useVarietyOptions();
  const gradeOptions = useGradeOptions();

  const { fields, append, remove } = useFieldArray({
    control,
    name: `tabs.${tabIndex}.varieties` as const,
  });

  // 品種セレクタの選択値
  const [selectedVarietyId, setSelectedVarietyId] = useState<string>('');

  // 品種選択時の等級初期化
  const watchedVarieties = watch(`tabs.${tabIndex}.varieties`);

  // 追加済み品種IDリスト（watchedVarietiesから算出）
  const addedVarietyIds = useMemo(
    () => (watchedVarieties ?? []).map((v) => v.variety_id).filter(Boolean),
    [watchedVarieties]
  );

  // 品種セレクタ用オプション（追加済みを除外）
  const varietySelectOptions: OptionType[] = useMemo(
    () =>
      varietyOptions
        .filter((opt) => !addedVarietyIds.includes(opt.value.toString()))
        .map((opt) => ({ label: opt.label, value: opt.value.toString() })),
    [varietyOptions, addedVarietyIds]
  );

  // 品種IDから品種名を取得
  const getVarietyName = (varietyId: string) =>
    varietyOptions.find((v) => v.value.toString() === varietyId)?.label ?? '';

  // 品種追加ハンドラー
  const handleAddVariety = () => {
    if (!selectedVarietyId) return;
    append({ variety_id: selectedVarietyId, grades: {} });
    setSelectedVarietyId('');
  };

  // 出荷種別に応じた等級フィルタリング
  const filteredGrades = useMemo(() => {
    return gradeOptions.filter((g) => {
      if (shipmentType.value === SHIPMENT_TYPE.DIRECT) {
        return g.shipment_scope === 'both' || g.shipment_scope === 'direct_only';
      }
      return g.shipment_scope === 'both' || g.shipment_scope === 'ja_only';
    });
  }, [gradeOptions, shipmentType.value]);

  // 販売等級と非販売等級を分離
  const salesGrades = useMemo(
    () => filteredGrades.filter((g) => g.type === 'sales'),
    [filteredGrades]
  );
  const nonSalesGrades = useMemo(
    () => filteredGrades.filter((g) => g.type === 'non_sales'),
    [filteredGrades]
  );
  useEffect(() => {
    if (watchedVarieties) {
      watchedVarieties.forEach((variety, index) => {
        if (variety.variety_id) {
          const currentGrades = variety.grades || {};
          const updatedGrades = { ...currentGrades };
          filteredGrades.forEach((grade) => {
            const key = grade.value.toString();
            if (updatedGrades[key] === undefined) {
              updatedGrades[key] = 0;
            }
          });
          if (JSON.stringify(currentGrades) !== JSON.stringify(updatedGrades)) {
            setValue(`tabs.${tabIndex}.varieties.${index}.grades`, updatedGrades);
          }
        }
      });
    }
  }, [watchedVarieties, filteredGrades, setValue, tabIndex]);

  // 品種ごとの小計計算
  const getSubtotal = (grades: Record<string, number>) => {
    return Object.values(grades).reduce((sum, qty) => sum + (qty || 0), 0);
  };

  const isDirectSaleTab = shipmentType.has_direct_sale_items;

  return (
    <div hidden={!isActive}>
      {isDirectSaleTab ? (
        /* 直売タブ: 品種カード型UIのみ */
        <DirectSaleItems control={control} errors={errors} trigger={trigger} />
      ) : (
        /* 他タブ: 既存の等級テーブル */
        <>
          {/* セクション区切り */}
          <div className="ds-section-divider">品種別出荷数</div>

          {/* 品種追加行 */}
          <div className="ds-variety-add-row">
            <SelectBoxBase<ShipmentRecordFormInputs>
              name={`tabs.${tabIndex}.varieties` as any}
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

          {/* タブ全体のエラー */}
          {errors.tabs?.root?.message && (
            <p className="text-sm text-red-500 mb-3">{errors.tabs.root.message}</p>
          )}

          {fields.length === 0 && (
            <div className="text-center text-gray-400 py-6 text-sm">
              品種を選択して「品種を追加」ボタンを押してください
            </div>
          )}

          {fields.map((field, varietyIndex) => {
            const varietyId = watch(`tabs.${tabIndex}.varieties.${varietyIndex}.variety_id`);
            const currentGrades = watch(`tabs.${tabIndex}.varieties.${varietyIndex}.grades`) || {};

            return (
              <div key={field.id} className="ds-variety-card">
                {/* カードヘッダー */}
                <div className="ds-variety-card__header">
                  <span className="ds-variety-card__title">
                    {getVarietyName(varietyId)}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md
                      text-[var(--error)] border border-transparent hover:bg-[var(--error-bg)] transition-colors"
                    onClick={() => remove(varietyIndex)}
                  >
                    <X size={14} /> 品種削除
                  </button>
                </div>

                {/* 等級入力テーブル（品種選択後に表示） */}
                {varietyId && filteredGrades.length > 0 && (
                  <div className="shipment-grade-table-wrapper">
                    <table className="shipment-grade-table">
                      <thead>
                        <tr>
                          <th></th>
                          {salesGrades.length > 0 && salesGrades.map((grade) => (
                            <th key={grade.value}>
                              <div>{grade.label}</div>
                              <span className="shipment-grade-type-tag shipment-grade-type-tag--sales">販売</span>
                            </th>
                          ))}
                          {nonSalesGrades.length > 0 && nonSalesGrades.map((grade) => (
                            <th key={grade.value}>
                              <div>{grade.label}</div>
                              <span className="shipment-grade-type-tag shipment-grade-type-tag--non-sales">非販売</span>
                            </th>
                          ))}
                          <th>小計</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-xs font-medium text-gray-500">数量</td>
                          {[...salesGrades, ...nonSalesGrades].map((grade) => {
                            const gradeKey = grade.value.toString();
                            return (
                              <td key={grade.value}>
                                <Controller
                                  name={`tabs.${tabIndex}.varieties.${varietyIndex}.grades.${gradeKey}` as any}
                                  control={control}
                                  render={({ field: f }) => (
                                    <input
                                      type="number"
                                      className="shipment-num-input"
                                      value={f.value ?? 0}
                                      onChange={(e) => f.onChange(parseInt(e.target.value) || 0)}
                                      min={0}
                                    />
                                  )}
                                />
                              </td>
                            );
                          })}
                          <td className="shipment-row-subtotal">
                            {getSubtotal(currentGrades)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default function ShipmentRecordForm({
  control,
  errors,
  trigger,
  watch,
  setValue,
}: ShipmentRecordFormProps) {
  const shipmentTypeOptions = SHIPMENT_TYPE_OPTIONS;
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  return (
    <div className="form-area space-y-6 p-4">
      {/* タブバー */}
      {shipmentTypeOptions.length > 0 && (
        <div className="shipment-type-tabs">
          {shipmentTypeOptions.map((type, index) => (
            <button
              key={type.value}
              type="button"
              className={`shipment-type-tab ${index === activeTabIndex ? 'shipment-type-tab--active' : ''}`}
              onClick={() => setActiveTabIndex(index)}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}

      {/* タブパネル（全タブ常時レンダー、hiddenで切替） */}
      {shipmentTypeOptions.map((type, tabIndex) => (
        <TabPanel
          key={type.value}
          tabIndex={tabIndex}
          shipmentType={type}
          isActive={tabIndex === activeTabIndex}
          control={control}
          errors={errors}
          trigger={trigger}
          watch={watch}
          setValue={setValue}
        />
      ))}

      {/* 備考 */}
      <div className="shipment-notes-area">
        <TextArea
          control={control}
          name="notes"
          inputLabel="備考"
          trigger={trigger}
          errorMessage={errors.notes?.message}
        />
      </div>
    </div>
  );
}
