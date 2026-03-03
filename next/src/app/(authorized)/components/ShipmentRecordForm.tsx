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
import SelectBox from '@/components/input/SelectBox';
import TextArea from '@/components/input/TextArea';
import Button from '@/components/ui/Button';
import DirectSaleItems from './DirectSaleItems';
import { useVarietyOptions } from '@/stores/useVarietyOptionStore';
import { useGradeOptions } from '@/stores/useGradeOptionStore';
import { SHIPMENT_TYPE_OPTIONS } from '@/constants/shipmentType';
import type { OptionType, ShipmentTypeApiOptionType } from '@/types';
import type { ShipmentRecordFormInputs } from '@/types/shipmentRecord';
import { varietyEntryDefaultValues } from '@/types/shipmentRecord';

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

  // 品種オプションをSelectBox用に変換
  const varietySelectOptions: OptionType[] = useMemo(
    () => varietyOptions.map((opt) => ({ label: opt.label, value: opt.value.toString() })),
    [varietyOptions]
  );

  // 販売等級と非販売等級を分離
  const salesGrades = useMemo(
    () => gradeOptions.filter((g) => g.type === 'sales'),
    [gradeOptions]
  );
  const nonSalesGrades = useMemo(
    () => gradeOptions.filter((g) => g.type === 'non_sales'),
    [gradeOptions]
  );

  // 品種選択時の等級初期化
  const watchedVarieties = watch(`tabs.${tabIndex}.varieties`);
  useEffect(() => {
    if (watchedVarieties) {
      watchedVarieties.forEach((variety, index) => {
        if (variety.variety_id) {
          const currentGrades = variety.grades || {};
          const updatedGrades = { ...currentGrades };
          gradeOptions.forEach((grade) => {
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
  }, [watchedVarieties, gradeOptions, setValue, tabIndex]);

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
          {/* 品種追加 */}
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-semibold">品種別出荷数</h4>
            <Button
              type="button"
              onClick={() => append(varietyEntryDefaultValues)}
              className="!px-4 !py-1.5 !text-xs"
            >
              品種を追加
            </Button>
          </div>

          {/* タブ全体のエラー */}
          {errors.tabs?.root?.message && (
            <p className="text-sm text-red-500 mb-3">{errors.tabs.root.message}</p>
          )}

          {fields.length === 0 && (
            <div className="text-center text-gray-400 py-6 text-sm">
              「品種を追加」ボタンから出荷する品種を追加してください
            </div>
          )}

          {fields.map((field, varietyIndex) => {
            const selectedVarietyId = watch(`tabs.${tabIndex}.varieties.${varietyIndex}.variety_id`);
            const currentGrades = watch(`tabs.${tabIndex}.varieties.${varietyIndex}.grades`) || {};

            return (
              <div key={field.id} className="border rounded-lg py-4 px-3 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex-1">
                    <SelectBox
                      control={control}
                      name={`tabs.${tabIndex}.varieties.${varietyIndex}.variety_id` as const}
                      inputLabel="品種を選択"
                      option={varietySelectOptions}
                      trigger={trigger}
                      errorMessage={errors.tabs?.[tabIndex]?.varieties?.[varietyIndex]?.variety_id?.message}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => remove(varietyIndex)}
                    color="alert"
                    outline
                    className="ml-2 !px-3 !py-1 !text-xs"
                  >
                    削除
                  </Button>
                </div>

                {/* 等級入力テーブル（品種選択後に表示） */}
                {selectedVarietyId && gradeOptions.length > 0 && (
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
