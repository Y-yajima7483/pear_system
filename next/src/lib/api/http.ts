
import axios, { AxiosError, AxiosInstance } from "axios";

export type LaravelValidationErrors = Record<string, string[]>;
export type ApiError =
  | {
      status: 422;
      message: string;
      errors: LaravelValidationErrors; // Laravelのerrorsバッグ
    }
  | {
      status: 401 | 403 | 404 | 409 | 415 | 429 | 500 | number;
      message: string; // Laravelのmessageや汎用メッセージ
      errors?: unknown;
    };

export type ErrorPresenter = (error: ApiError) => void;

// 共通Axiosインスタンス（必要に応じてヘッダ設定）
export const http: AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`,
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Laravelエラー→統一メッセージ整形
export function toApiError(e: unknown): ApiError {
  const axErr = e as AxiosError<any>;
  const status = axErr?.response?.status ?? 0;
  const data = axErr?.response?.data;

  // Laravelの422（Validation）は errors オブジェクトが付与される
  if (status === 422) {
    const message: string =
      data?.message ??
      "入力内容を確認してください。"; // Laravelの標準メッセージが無い場合のフォールバック
    const errors: LaravelValidationErrors = data?.errors ?? {};
    return { status: 422, message, errors };
  }

  // Laravelのその他エラーは message を含むことが多い
  const message: string =
    data?.message ??
    "エラーが発生しました。"; // Fallback

  return { status: status || 500, message, errors: data?.errors };
}

// 規定のエラーハンドラ（要件の分岐）
export function handleApiError(
  e: unknown,
  opts: {
    unauthorizedProcess?: (message: string)=> void; // 401でログイン画面へ飛ばす処理を注入
    process?: ErrorPresenter; // 画面出し用（トースト等）
  } = {}
) {
  const err = toApiError(e);

  // 取り消し（Abort）は呼び出し側で握りつぶすのでここでは扱わない

  switch (err.status) {
    case 422: {
      // バリデーションエラーを表示（呼び出し側で errors を使ってフィールドごとに表示も可）
      opts.process?.({
        status: 422,
        message: err.message,
        errors: (err as any).errors ?? {},
      });
      return;
    }
    case 401: {
      // ログイン画面に遷移
      if (opts.unauthorizedProcess) {
        opts.unauthorizedProcess(err.message);
      } else {
        window.location.href = "/login";
      }
      return;
    }
    case 429: {
      opts.process?.({
        status: 429,
        message: "リクエストが集中しています。しばらくしてから再度お試しください。",
      });
      return;
    }
    case 403: {
      opts.process?.({
        status: 403,
        message: "この操作を行う権限がありません。",
      });
      return;
    }
    default: {
      // その他は指定のメッセージ構成で通知
      const code = err.status;
      const laravelMessage = err.message ?? "";
      const joined =
        `エラーが発生しました。\n` +
        `${code}\n` +
        `${laravelMessage}`;
      opts.process?.({ status: code, message: joined });
      return;
    }
  }
}
