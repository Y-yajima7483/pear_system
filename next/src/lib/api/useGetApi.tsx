'use client'

import { useCallback, useRef, useState } from "react";
import axios, { AxiosRequestConfig } from "axios";
import { http, handleApiError } from "./http";
import { ApiHookResponseType } from "@/types/index";


export default function useGetApi<T = unknown>(opts?: {
  presentError?: (e: any) => void;
  onUnauthorizedRedirect?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const get = useCallback(
    async (url: string, config?: AxiosRequestConfig): Promise<ApiHookResponseType<T>> => {
      // 前回のリクエストがあれば中断（多重実行防止）
      if (controllerRef.current) controllerRef.current.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setLoading(true);
      try {
        const res = await http.get<T>(url, {
          ...(config ?? {}),
          signal: controller.signal, // ★重要：Axios v1 は signal をサポート
        });
        return { data: res.data, success: true };
      } catch (e) {
        // 取り消しは無視
        if (axios.isCancel(e)) return { data: undefined, success: false };
        handleApiError(e, {
          process: opts?.presentError,
          unauthorizedProcess: opts?.onUnauthorizedRedirect,
        });
        return { data: undefined, success: false };
      } finally {
        setLoading(false);
      }
    },
    [opts?.onUnauthorizedRedirect, opts?.presentError]
  );

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  return { get, cancel, loading };
}
