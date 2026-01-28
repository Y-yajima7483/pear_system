'use client';

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
} from "@/components/ui/dialog";
import Button from "@/components/ui/Button";
import OrderForm, { OrderFormInputs, ItemValueType } from './OrderForm';
import usePutApi from '@/lib/api/usePutApi';
import { commonApiHookOptions } from '@/lib/api/commonErrorHandlers';
import { orderUpdateFormSchema } from '@/lib/validation/order';
import { OrderDetailData } from '@/types/order';

// APIリクエスト型(注文情報)
interface OrderItemRequestType {
  variety_id: number; // 品種ID
  items: Array<{
    product_id: number; // 商品ID
    quantity: number; // 数量
  }>;
}

interface OrderUpdateDialogProps {
  orderData: OrderDetailData;
  onOrderUpdated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function OrderUpdateDialog({
  orderData,
  onOrderUpdated,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: OrderUpdateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { update } = usePutApi(commonApiHookOptions);

  // 制御モード（親から open/onOpenChange が渡される）か非制御モードかを判定
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  // 注文データをフォーム用の初期値に変換
  const convertOrderDataToFormValues = (data: OrderDetailData): OrderFormInputs => {
    const items: ItemValueType[] = data.items.map(item => {
      const product: { [key: string]: string } = {};
      item.products.forEach(p => {
        product[p.product_id.toString()] = p.quantity.toString();
      });

      return {
        variety_id: item.variety_id.toString(),
        product,
      };
    });

    return {
      customer_name: data.customer_name,
      notes: data.notes || '',
      pickup_date: data.pickup_date ? new Date(data.pickup_date) : '',
      pickup_time: data.pickup_time || '',
      items,
      status: data.status,
    };
  };

  const { control, trigger: triggerValidation, handleSubmit, formState: {errors}, reset, watch, setValue } = useForm<OrderFormInputs>({
    resolver: yupResolver(orderUpdateFormSchema),
    defaultValues: convertOrderDataToFormValues(orderData),
  });

  const fieldArray = useFieldArray({
    control,
    name: 'items'
  });

  // ダイアログが開いた時にフォームをリセット
  useEffect(() => {
    if (open) {
      reset(convertOrderDataToFormValues(orderData));
      
    }
  }, [open, orderData, reset]);

  // 注文更新
  const onSubmit = async(data: OrderFormInputs) => {
    // 注文情報を整形
    let orderItem: Array<OrderItemRequestType> = [];
    data.items.forEach((variety, index) => {
      const items = Object.entries(variety.product)
        .filter(([_, quantity]) => quantity && parseInt(quantity) > 0)
        .map(([productId, quantity]) => ({
          product_id: parseInt(productId),
          quantity: parseInt(quantity),
        }))
      orderItem.push({
        variety_id: parseInt(variety.variety_id),
        items,
      });
    });
    const res = await update(`/order/${orderData.id}`, {
      customer_name: data.customer_name,
      notes: data.notes,
      pickup_date: data.pickup_date ? format(data.pickup_date, 'yyyy-MM-dd') : null,
      pickup_time: data.pickup_time ? data.pickup_time : null,
      items: orderItem,
      status: data.status,
    });

    if(res.success) {
      setOpen(false);
      if (onOrderUpdated) {
        onOrderUpdated();
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[70vh] overflow-y-scroll p-0 max-w-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sticky top-0 z-2 bg-background w-full p-4">
          <DialogTitle>注文情報編集</DialogTitle>
          <DialogDescription>
            注文内容を編集してください
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <OrderForm
            control={control}
            errors={errors}
            trigger={triggerValidation}
            watch={watch}
            setValue={setValue}
            fieldArray={fieldArray}
            isEditMode={true}
          />
        </form>
        <DialogFooter className="sticky bottom-0 z-10 bg-background w-full p-4 border-b">
          <DialogClose asChild>
            <Button type="button" outline className='w-full'>閉じる</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit(onSubmit)} className='w-full'>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
