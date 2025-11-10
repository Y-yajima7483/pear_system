export interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string;
}

export const defaultMetadata: PageMetadata = {
  title: 'PEAR System - 注文管理システム',
  description: '梨の注文・受取予約管理システム',
  keywords: '梨, 注文管理, 受取予約, PEAR',
};
