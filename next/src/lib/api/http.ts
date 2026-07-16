import axios from 'axios';
import type { AxiosInstance } from 'axios';

export type LaravelValidationErrors = Record<string, string[]>;

export type ApiError = {
  status: number;
  message: string;
  errors?: LaravelValidationErrors;
};

export type ErrorPresenter = (error: ApiError) => void;

export type ApiHookOptions = {
  presentError?: ErrorPresenter;
  onUnauthorizedRedirect?: (message: string) => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getMessage = (data: unknown): string | undefined => {
  if (!isRecord(data)) {
    return undefined;
  }

  return typeof data.message === 'string' ? data.message : undefined;
};

const getValidationErrors = (data: unknown): LaravelValidationErrors | undefined => {
  if (!isRecord(data) || !isRecord(data.errors)) {
    return undefined;
  }

  const entries = Object.entries(data.errors).filter(
    (entry): entry is [string, string[]] =>
      Array.isArray(entry[1]) && entry[1].every((message) => typeof message === 'string')
  );

  return Object.fromEntries(entries);
};

// Laravel API は nginx/Next と同一オリジンの /api で公開する。
export const http: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/** ログイン前に Sanctum の CSRF Cookie を同一オリジンから取得する。 */
export const initializeCsrfCookie = async (): Promise<void> => {
  await http.get('/sanctum/csrf-cookie', { baseURL: '/' });
};

// Laravelエラー→統一メッセージ整形
export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { status: 500, message: 'エラーが発生しました。' };
  }

  const status = error.response?.status ?? 500;
  const data: unknown = error.response?.data;
  const message = getMessage(data) ?? (
    status === 422 ? '入力内容を確認してください。' : 'エラーが発生しました。'
  );
  const errors = getValidationErrors(data);

  return errors ? { status, message, errors } : { status, message };
}

// 規定のエラーハンドラ（要件の分岐）
export function handleApiError(
  error: unknown,
  opts: {
    unauthorizedProcess?: (message: string) => void;
    process?: ErrorPresenter;
  } = {}
): void {
  const apiError = toApiError(error);

  switch (apiError.status) {
    case 422:
      opts.process?.({
        status: 422,
        message: apiError.message,
        errors: apiError.errors ?? {},
      });
      return;
    case 401:
      if (opts.unauthorizedProcess) {
        opts.unauthorizedProcess(apiError.message);
      } else if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    case 429:
      opts.process?.({
        status: 429,
        message: 'リクエストが集中しています。しばらくしてから再度お試しください。',
      });
      return;
    case 403:
      opts.process?.({
        status: 403,
        message: 'この操作を行う権限がありません。',
      });
      return;
    default:
      opts.process?.({
        status: apiError.status,
        message: `エラーが発生しました。\n${apiError.status}\n${apiError.message}`,
      });
  }
}
