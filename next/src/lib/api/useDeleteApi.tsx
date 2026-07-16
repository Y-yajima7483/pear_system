'use client'

import { useCallback, useState } from "react";
import type { AxiosRequestConfig } from "axios";
import { http, handleApiError } from "./http";
import type { ApiHookOptions } from "./http";
import type { ApiHookResponseType } from "@/types/index";

export default function useDeleteApi<T = unknown>(opts?: ApiHookOptions) {
  const [loading, setLoading] = useState(false);

  const destroy = useCallback(
    async (url: string, config?: AxiosRequestConfig): Promise<ApiHookResponseType<T>> => {
      setLoading(true);
      try {
        const res = await http.delete<T>(url, config);
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

  return { destroy, loading };
}
