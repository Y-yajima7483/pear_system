'use client'

import React, { useLayoutEffect } from 'react'
import * as yup from "yup"
import { toast } from 'sonner';
import { unauthorized, useRouter } from 'next/navigation';
import { useForm, FieldValues } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button'
import TextField from '@/components/input/TextField';
import { UserDataType } from '@/types/index';
import { userStore } from '@/stores/useUserStore';
import { http,handleApiError } from '@/lib/api/http';
import { overlayStore } from '@/stores/useOverlayStore';
import { useVarietyOptionStore } from '@/stores/useVarietyOptionStore';
import { useProductOptionStore } from '@/stores/useProductOptionStore'; 

interface FormData {
  email: string;
  password: string;
}

const schema = yup.object({
	email: yup.string().nullable().required('メールアドレスは必須です'),
  password: yup.string().nullable().required('パスワードは必須です'),
});

export default function Home() {
  const router = useRouter();
  const { openOverlay, closeOverlay } = overlayStore();
  const { isAuthorized, login } = userStore();
  const { fetchVarietyOptions } = useVarietyOptionStore();
  const { fetchProductOptions } = useProductOptionStore();
  const { control, trigger, handleSubmit, formState: { errors }, } = useForm<FormData>({
    defaultValues: { email: "", password: "" },
    resolver: yupResolver(schema),
  });
  useLayoutEffect(()=> {
    if(isAuthorized) router.push("/");
  },[isAuthorized]);
  const onSubmit = async(data:FieldValues) => {
      try {
        openOverlay();
        const res = await http.post<UserDataType>("/login", data);
        console.log(res.status)
        login(res.data);
        
        // ログイン成功後に品種一覧と商品一覧を取得
        await Promise.all([
          fetchVarietyOptions(),
          fetchProductOptions()
        ]);
        
        toast.success("ログインしました");
      } catch(e) {
        console.log(e)
        handleApiError(e, {
          process: ({status, message, errors})=> {
            if(status === 422 && errors) {
              const errorMessages = Object.keys(errors).map((val)=> {
                const key = val as keyof typeof errors
                return errors[key];
              }).join("\n");
              toast.error(message, {
                description: errorMessages,
                className: "whitespace-pre-line",
              });
            }
            toast.error(message);
          },
          unauthorizedProcess: (message)=> {
            toast.error(message);
          }
        });
      } finally {
        closeOverlay()
      }
  }

  return (
    <Card title="ログイン" size="lg" >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-lg shadow">
        <TextField
          control={control}
          trigger={trigger}
          name={"email"}
          inputLabel="メールアドレス"
          type="email"
          errorMessage={errors?.email?.message}
        />
        <TextField
          control={control}
          trigger={trigger}
          name={"password"}
          inputLabel="パスワード"
          type="password"
          errorMessage={errors?.password?.message}
        />
        <div className="flex justify-center w-auto">
          <Button type="submit" color="primary">ログイン</Button>
        </div>
      </form>
    </Card>
  )
}