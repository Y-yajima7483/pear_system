'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { format } from 'date-fns';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/input/DatePicker';
import ShipmentRecordForm from './ShipmentRecordForm';
import usePutApi from '@/lib/api/usePutApi';
import { commonApiHookOptions } from '@/lib/api/commonErrorHandlers';
import { directSaleFormSchema } from '@/lib/validation/shipmentRecord';
import { useVarietyOptionStore, useVarietyOptions } from '@/stores/useVarietyOptionStore';
import { useProductOptionStore } from '@/stores/useProductOptionStore';
import { useGradeOptionStore, useGradeOptions } from '@/stores/useGradeOptionStore';
import { toast } from 'sonner';
import type { GradeApiOptionType } from '@/types';
import type {
  DirectSaleFormInputs,
  ShipmentRecordMutationApiResponse,
  UpsertDirectSaleRequest,
} from '@/types/shipmentRecord';

/** 編集モードで渡す既存データ */
export interface DirectSaleEditData {
  record_date: string; // "yyyy-MM-dd"（編集時は日付固定）
  notes: string;
  direct_sale_items: DirectSaleFormInputs['direct_sale_items'];
  manual_grade_entries: DirectSaleFormInputs['manual_grade_entries'];
}

interface ShipmentRecordRegisterDialogProps {
  /** 保存成功後のコールバック（一覧・詳細の再取得用） */
  onSaved?: () => void;
  /** 編集モード: 既存の直売データをプリフィルする。日付は固定される */
  editData?: DirectSaleEditData;
  /** 編集モードで親から開閉を制御する場合に指定 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const createDefaultValues = (
  editData: DirectSaleEditData | undefined,
  directGradeOptions: GradeApiOptionType[]
): DirectSaleFormInputs => {
  const sourceManualEntries = editData?.manual_grade_entries ?? [];
  const manualQuantityByKey = new Map(
    sourceManualEntries.map((entry) => [
      `${entry.variety_id}:${entry.grade_id}`,
      entry.quantity,
    ])
  );
  const activeVarietyIds = Array.from(
    new Set(sourceManualEntries.map((entry) => entry.variety_id))
  );
  const manualGradeEntries = directGradeOptions.length > 0
    ? activeVarietyIds.flatMap((varietyId) =>
        directGradeOptions.map((grade) => ({
          variety_id: varietyId,
          grade_id: grade.value.toString(),
          quantity: manualQuantityByKey.get(`${varietyId}:${grade.value}`) ?? 0,
        }))
      )
    : sourceManualEntries.map((entry) => ({ ...entry }));

  return {
    record_date: editData ? editData.record_date : new Date(),
    notes: editData?.notes ?? '',
    direct_sale_items: (editData?.direct_sale_items ?? []).map((item) => ({ ...item })),
    manual_grade_entries: manualGradeEntries,
  };
};

export default function ShipmentRecordRegisterDialog({
  onSaved,
  editData,
  open: controlledOpen,
  onOpenChange,
}: ShipmentRecordRegisterDialogProps) {
  const isEdit = editData !== undefined;
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;

  const { update, loading: saving } = usePutApi<UpsertDirectSaleRequest, ShipmentRecordMutationApiResponse>(
    commonApiHookOptions
  );

  const fetchVarietyOptions = useVarietyOptionStore((s) => s.fetchVarietyOptions);
  const fetchProductOptions = useProductOptionStore((s) => s.fetchProductOptions);
  const fetchGradeOptions = useGradeOptionStore((s) => s.fetchGradeOptions);
  const productOptionsInitialized = useProductOptionStore((s) => s.isInitialized);
  const productOptionsError = useProductOptionStore((s) => s.error);
  const varietyOptions = useVarietyOptions();
  const gradeOptions = useGradeOptions();
  const directGradeOptions = useMemo(
    () => gradeOptions.filter((grade) => grade.shipment_scope !== 'ja_only'),
    [gradeOptions]
  );
  const masterDataReady =
    directGradeOptions.length > 0 &&
    varietyOptions.length > 0 &&
    productOptionsInitialized;

  // オプションデータを取得
  useEffect(() => {
    fetchVarietyOptions();
    fetchProductOptions();
    fetchGradeOptions();
  }, [fetchGradeOptions, fetchProductOptions, fetchVarietyOptions]);

  const {
    control,
    trigger,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<DirectSaleFormInputs>({
    resolver: yupResolver(directSaleFormSchema) as unknown as Resolver<DirectSaleFormInputs>,
    defaultValues: createDefaultValues(editData, directGradeOptions),
  });

  // controlled編集は親のボタンから open が切り替わるため、Dialog の
  // onOpenChange を経由しない。open時および対象日のdaily data更新時に
  // 必ずその編集対象でフォームを初期化する。
  useEffect(() => {
    if (!isControlled || !open || !masterDataReady) {
      return;
    }

    reset(createDefaultValues(editData, directGradeOptions));
  }, [directGradeOptions, editData, isControlled, masterDataReady, open, reset]);

  const setOpen = useCallback(
    (isOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(isOpen);
      } else {
        setInternalOpen(isOpen);
      }
      if (isOpen) {
        reset(createDefaultValues(editData, directGradeOptions));
      }
    },
    [directGradeOptions, editData, isControlled, onOpenChange, reset]
  );

  // 送信処理: 商品明細と品種×等級の商品外数量をまとめて置換する
  const onSubmit = async (data: DirectSaleFormInputs) => {
    const requestData: UpsertDirectSaleRequest = {
      record_date:
        data.record_date instanceof Date
          ? format(data.record_date, 'yyyy-MM-dd')
          : data.record_date,
      direct_sale_items: data.direct_sale_items
        .filter((item) => item.product_id && item.box_quantity > 0)
        .map((item) => ({
          product_id: Number(item.product_id),
          fruit_quantity: item.fruit_quantity,
          box_quantity: item.box_quantity,
        })),
      manual_grade_entries: data.manual_grade_entries.map((entry) => ({
        variety_id: Number(entry.variety_id),
        grade_id: Number(entry.grade_id),
        quantity: entry.quantity,
      })),
    };

    const trimmedNotes = data.notes.trim();
    if (isEdit) {
      requestData.notes = trimmedNotes === '' ? null : data.notes;
    } else if (trimmedNotes !== '') {
      requestData.notes = data.notes;
    }

    const res = await update('/shipment-record/direct-sale', requestData);
    if (res.success && res.data.success) {
      toast.success(res.data.message);
      // 新規登録だけ次回用の初期値へ戻す。編集は外部open時に最新daily dataで
      // 再初期化するため、ここで今日の日付の新規defaultを混入させない。
      if (!isEdit) {
        reset(createDefaultValues(undefined, directGradeOptions));
      }
      setOpen(false);
      onSaved?.();
    } else if (res.success) {
      toast.error(res.data.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button type="button" className="text-sm py-2 px-2" disabled={!masterDataReady}>
            <Plus />
            直売出荷登録
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className="max-h-[80vh] min-w-4xl overflow-y-scroll p-0 max-w-4xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sticky top-0 z-2 bg-background w-full p-4">
          <DialogTitle>{isEdit ? '直売出荷記録の編集' : '直売出荷記録'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `${editData.record_date} の直売データを編集します`
              : '直売の出荷数量を入力してください'}
          </DialogDescription>
        </DialogHeader>
        {masterDataReady ? (
          <form id="direct-sale-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="px-4 pb-2">
              {isEdit ? (
                <div className="text-sm font-medium py-2">
                  記録日: {editData.record_date}
                </div>
              ) : (
                <>
                  <DatePicker
                    control={control}
                    name="record_date"
                    inputLabel="記録日"
                    trigger={trigger}
                    errorMessage={errors.record_date?.message as string | undefined}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    同じ日付で保存すると、その日の直売データを上書きします
                  </p>
                </>
              )}
            </div>
            <ShipmentRecordForm
              control={control}
              errors={errors}
              trigger={trigger}
            />
          </form>
        ) : (
          <div
            className={`p-8 text-center text-sm ${
              productOptionsError ? 'text-[var(--error)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {productOptionsError ?? '入力用マスタを読み込んでいます…'}
          </div>
        )}
        <DialogFooter className="sticky bottom-0 z-10 bg-background w-full p-4 border-b">
          {isDirty && (
            <span className="self-center text-xs text-[var(--error)]">未保存の変更があります</span>
          )}
          <DialogClose asChild>
            <Button type="button" outline className="w-full">閉じる</Button>
          </DialogClose>
          <Button
            type="submit"
            form="direct-sale-form"
            className="w-full"
            disabled={saving || !masterDataReady}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
