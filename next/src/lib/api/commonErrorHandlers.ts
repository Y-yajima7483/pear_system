'use client'

import { toast } from 'sonner';
import { ApiError } from './http';
import { userStore } from '@/stores/useUserStore';

/**
 * トーストでエラーメッセージを表示する共通ハンドラー
 * ステータスコードごとに個別のトースト処理を実行
 */
export const ccommonErrorHandle = (error: ApiError): void => {
  switch (error.status) {
    case 422:
      // バリデーションエラー
      toast.error(error.message, {
        description: 'バリデーションエラー',
        duration: 5000,
      });
      break;
    
    case 401:
      // 認証エラー
      toast.error('認証が必要です', {
        description: 'ログインしてください',
        duration: 5000,
      });
      break;
    
    case 403:
      // 権限エラー
      toast.error(error.message, {
        description: 'アクセス権限エラー',
        duration: 5000,
      });
      break;
    
    case 404:
      // リソースが見つからない
      toast.error('リソースが見つかりません', {
        description: error.message,
        duration: 5000,
      });
      break;
    
    case 409:
      // 競合エラー
      toast.error('データの競合が発生しました', {
        description: error.message,
        duration: 5000,
      });
      break;
    
    case 415:
      // メディアタイプエラー
      toast.error('サポートされていない形式です', {
        description: error.message,
        duration: 5000,
      });
      break;
    
    case 429:
      // レート制限
      toast.error(error.message, {
        description: 'レート制限エラー',
        duration: 7000,
      });
      break;
    
    case 500:
      // サーバーエラー
      toast.error('サーバーエラーが発生しました', {
        description: error.message,
        duration: 5000,
      });
      break;
    
    default:
      // その他のエラー
      toast.error(error.message, {
        description: `エラーコード: ${error.status}`,
        duration: 5000,
      });
      break;
  }
};

/**
 * 認証エラー時の共通ハンドラー
 * ユーザー情報を削除してログイン画面に遷移
 */
export const commonUnauthorizedErrorHandle = (): void => {
  // userStoreからlogoutメソッドを呼び出してユーザー情報を削除
  const { logout } = userStore.getState();
  logout();
  
  // ログイン画面に遷移
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

/**
 * APIフックで使用するための共通オプション
 */
export const commonApiHookOptions = {
  presentError: ccommonErrorHandle,
  onUnauthorizedRedirect: commonUnauthorizedErrorHandle,
};