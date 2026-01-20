'use client';

import { useState } from 'react'
import { Plus } from 'lucide-react';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import Button from "@/components/ui/Button";
import OrderForm, { OrderFormInputs, itemDefaultValues } from './OrderForm';
import usePostApi from '@/lib/api/usePostApi';
import { commonApiHookOptions } from '@/lib/api/commonErrorHandlers';
import { orderFormSchema } from '@/lib/validation/order';

// APIリクエスト型(注文情報)
interface OrderItemRequestType {
  variety_id: number; // 品種ID
  items: Array<{
    product_id: number; // 商品ID
    quantity: number; // 数量
  }>;
}

interface OrderRegisterDialogProps {
  onOrderCreated?: () => void;
}

export default function OrderRegisterDialog({ onOrderCreated }: OrderRegisterDialogProps) {
  const [open, setOpen] = useState(false);
  const { post } = usePostApi(commonApiHookOptions);

  const { control, trigger, handleSubmit, formState: {errors}, reset, watch, setValue } = useForm<OrderFormInputs>({
    resolver: yupResolver(orderFormSchema),
    defaultValues: {
      customer_name: '',
      notes: '',
      pickup_date: '',
      pickup_time: '',
      items: [itemDefaultValues],
    },
  });

  const fieldArray = useFieldArray({
    control,
    name: 'items'
  });

  // 注文登録
  const onSubmit = async(data: OrderFormInputs) => {
    // 注文情報を整形
    let orderItem:Array<OrderItemRequestType> = [];
    data.items.forEach(variety => {
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
    const res = await post('/order', {
      customer_name: data.customer_name,
      notes: data.notes,
      pickup_date: data.pickup_date ? format(data.pickup_date, 'yyyy-MM-dd') : null,
      pickup_time: data.pickup_time ? data.pickup_time : null,
      items: orderItem
    });
    if(res.success) {
      reset();
      setOpen(false);
      if (onOrderCreated) {
        onOrderCreated();
      }
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" onClick={() => reset()} className="text-sm py-2 px-2">
          <Plus />
          注文登録
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[70vh] overflow-y-scroll p-0 max-w-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sticky top-0 z-2 bg-background w-full p-4">
          <DialogTitle>新規登録</DialogTitle>
          <DialogDescription>
            注文内容を入力してください
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <OrderForm
            control={control}
            errors={errors}
            trigger={trigger}
            watch={watch}
            setValue={setValue}
            fieldArray={fieldArray}
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
