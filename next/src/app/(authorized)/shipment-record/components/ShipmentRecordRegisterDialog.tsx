'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useForm, Resolver } from 'react-hook-form';
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
import { directSaleFormSchema } from '@/lib/validation/shipmentRecord';
import { getGradeIdBySku } from '@/constants/grade';
import { useVarietyOptionStore } from '@/stores/useVarietyOptionStore';
import { useProductOptionStore } from '@/stores/useProductOptionStore';
import type { DirectSaleFormInputs } from '@/types/shipmentRecord';

interface ShipmentRecordRegisterDialogProps {
  onRecordCreated?: () => void;
}

const createDefaultValues = (): DirectSaleFormInputs => ({
  record_date: new Date(),
  notes: '',
  direct_sale_items: [],
});


export default function ShipmentRecordRegisterDialog({ onRecordCreated }: ShipmentRecordRegisterDialogProps) {
  const [open, setOpen] = useState(false);
  const { post } = usePostApi(commonApiHookOptions);

  const fetchVarietyOptions = useVarietyOptionStore((s) => s.fetchVarietyOptions);
  const fetchProductOptions = useProductOptionStore((s) => s.fetchProductOptions);

  // オプションデータを取得
  useEffect(() => {
    fetchVarietyOptions();
    fetchProductOptions();
  }, [fetchVarietyOptions, fetchProductOptions]);

  const {
    control,
    trigger,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DirectSaleFormInputs>({
    resolver: yupResolver(directSaleFormSchema) as unknown as Resolver<DirectSaleFormInputs>,
    defaultValues: createDefaultValues(),
  });

  // 送信処理
  const onSubmit = async (data: DirectSaleFormInputs) => {
    const productOptions = useProductOptionStore.getState().productOptions;
    const productById = new Map(productOptions.map((product) => [product.value.toString(), product]));

    // box_quantity > 0 の商品のみ抽出
    const validItems = data.direct_sale_items.filter(
      (item) => item.product_id && item.box_quantity > 0
    );

    // variety_id + grade_id ごとに box_quantity を集計
    const entryMap = new Map<string, { variety_id: number; grades: Map<number, number> }>();

    validItems.forEach((item) => {
      const product = productById.get(item.product_id);
      if (!product) return;

      const varietyId = product.variety;
      const gradeId = getGradeIdBySku(product.sku_suffix);
      const key = varietyId.toString();

      if (!entryMap.has(key)) {
        entryMap.set(key, { variety_id: varietyId, grades: new Map() });
      }
      const entry = entryMap.get(key)!;
      entry.grades.set(gradeId, (entry.grades.get(gradeId) ?? 0) + item.box_quantity);
    });

    // shipment_entries を構築
    const shipmentEntries = Array.from(entryMap.values()).map((e) => ({
      variety_id: e.variety_id,
      grades: Array.from(e.grades.entries()).map(([gradeId, quantity]) => ({
        grade_id: gradeId,
        quantity,
      })),
    }));

    // direct_sale_items を構築（box_quantity > 0 のみ）
    const directSaleItems = validItems.map((item) => {
      const product = productById.get(item.product_id);
      return {
        variety_id: product?.variety ?? 0,
        product_id: Number(item.product_id),
        fruit_quantity: item.fruit_quantity,
        box_quantity: item.box_quantity,
      };
    });

    const requestData = {
      record_date: data.record_date instanceof Date
        ? format(data.record_date, 'yyyy-MM-dd')
        : data.record_date,
      notes: data.notes || null,
      shipment_entries: shipmentEntries,
      direct_sale_items: directSaleItems,
    };

    const res = await post('/shipment-record/direct-sale', requestData);
    if (res.success) {
      reset(createDefaultValues());
      setOpen(false);
      if (onRecordCreated) {
        onRecordCreated();
      }
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      reset(createDefaultValues());
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="text-sm py-2 px-2">
          <Plus />
          直売出荷登録
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[80vh] min-w-4xl overflow-y-scroll p-0 max-w-4xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sticky top-0 z-2 bg-background w-full p-4">
          <DialogTitle>直売出荷記録</DialogTitle>
          <DialogDescription>
            直売の出荷数量を入力してください
          </DialogDescription>
        </DialogHeader>
        <form id="direct-sale-form" onSubmit={handleSubmit(onSubmit)}>
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
          />
        </form>
        <DialogFooter className="sticky bottom-0 z-10 bg-background w-full p-4 border-b">
          <DialogClose asChild>
            <Button type="button" outline className="w-full">閉じる</Button>
          </DialogClose>
          <Button type="submit" form="direct-sale-form" className="w-full">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
