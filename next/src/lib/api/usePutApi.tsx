'use client'

import { useCallback, useState } from "react";
import { AxiosRequestConfig } from "axios";
import { http, handleApiError } from "./http";
import { ApiHookResponseType } from "@/types/index";

export default function usePutApi<T extends object, K = unknown>(opts?: {
  presentError?: (e: any) => void;
  onUnauthorizedRedirect?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const update = useCallback(
    async (url: string, body: T, config?: AxiosRequestConfig): Promise<ApiHookResponseType<K>> => {
      setLoading(true);
      try {
        const res = await http.put<K>(url, body, config);
        return { data: res.data, success: true };
      } catch (e) {
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

  return { update, loading };
}
