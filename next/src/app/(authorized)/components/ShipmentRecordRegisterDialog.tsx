'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import usePostApi from '@/lib/api/usePostApi';
import { commonApiHookOptions } from '@/lib/api/commonErrorHandlers';
import { shipmentRecordFormSchema } from '@/lib/validation/shipmentRecord';
import { SHIPMENT_TYPE_OPTIONS } from '@/constants/shipmentType';
import { useGradeOptionStore } from '@/stores/useGradeOptionStore';
import { useVarietyOptionStore } from '@/stores/useVarietyOptionStore';
import { useProductOptionStore } from '@/stores/useProductOptionStore';
import type { ShipmentRecordFormInputs } from '@/types/shipmentRecord';

interface ShipmentRecordRegisterDialogProps {
  onRecordCreated?: () => void;
}

export default function ShipmentRecordRegisterDialog({ onRecordCreated }: ShipmentRecordRegisterDialogProps) {
  const [open, setOpen] = useState(false);
  const { post } = usePostApi(commonApiHookOptions);

  const shipmentTypeOptions = SHIPMENT_TYPE_OPTIONS;
  const fetchGradeOptions = useGradeOptionStore((s) => s.fetchGradeOptions);
  const fetchVarietyOptions = useVarietyOptionStore((s) => s.fetchVarietyOptions);
  const fetchProductOptions = useProductOptionStore((s) => s.fetchProductOptions);

  // オプションデータを取得
  useEffect(() => {
    fetchGradeOptions();
    fetchVarietyOptions();
    fetchProductOptions();
  }, [fetchGradeOptions, fetchVarietyOptions, fetchProductOptions]);

  // デフォルト値構築（出荷タイプ数分のタブ）
  const buildDefaultValues = (): ShipmentRecordFormInputs => ({
    record_date: new Date(),
    notes: '',
    tabs: shipmentTypeOptions.map((type) => ({
      shipment_type_id: type.value,
      varieties: [],
    })),
    direct_sale_items: [],
  });

  const {
    control,
    trigger,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ShipmentRecordFormInputs>({
    resolver: yupResolver(shipmentRecordFormSchema) as any,
    defaultValues: buildDefaultValues(),
  });

  // 送信処理（スタブ）
  const onSubmit = async (data: ShipmentRecordFormInputs) => {
    // フォームデータをAPIリクエスト形式に変換
    const requestData = {
      record_date: data.record_date instanceof Date ? format(data.record_date, 'yyyy-MM-dd') : data.record_date,
      notes: data.notes || null,
      shipment_entries: data.tabs
        .filter((tab) => tab.varieties.length > 0)
        .flatMap((tab) =>
          tab.varieties
            .filter((v) => v.variety_id)
            .map((v) => ({
              shipment_type_id: tab.shipment_type_id,
              variety_id: parseInt(v.variety_id),
              grades: Object.entries(v.grades)
                .filter(([_, qty]) => qty > 0)
                .map(([gradeId, quantity]) => ({
                  grade_id: parseInt(gradeId),
                  quantity,
                })),
            }))
        ),
      direct_sale_items: data.direct_sale_items
        .filter((item) => item.product_id && (item.fruit_quantity > 0 || item.box_quantity > 0))
        .map((item) => ({
          product_id: parseInt(item.product_id),
          fruit_quantity: item.fruit_quantity,
          box_quantity: item.box_quantity,
        })),
    };

    const res = await post('/shipment-record', requestData);
    if (res.success) {
      reset(buildDefaultValues());
      setOpen(false);
      if (onRecordCreated) {
        onRecordCreated();
      }
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      reset(buildDefaultValues());
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="text-sm py-2 px-2">
          <Plus />
          新規記録
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[80vh] min-w-3xl overflow-y-scroll p-0 max-w-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sticky top-0 z-2 bg-background w-full p-4">
          <DialogTitle>新規出荷記録</DialogTitle>
          <DialogDescription>
            出荷数量を入力してください
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-4 pb-2">
            <DatePicker
              control={control}
              name="record_date"
              inputLabel="記録日"
              trigger={trigger}
              errorMessage={errors.record_date?.message as string | undefined}
            />
          </div>
          <ShipmentRecordForm
            control={control}
            errors={errors}
            trigger={trigger}
            watch={watch}
            setValue={setValue}
          />
        </form>
        <DialogFooter className="sticky bottom-0 z-10 bg-background w-full p-4 border-b">
          <DialogClose asChild>
            <Button type="button" outline className="w-full">閉じる</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit(onSubmit)} className="w-full">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
