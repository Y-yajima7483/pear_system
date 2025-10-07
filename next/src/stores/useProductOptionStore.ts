import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { http } from '@/lib/api/http';
import { ProductApiOptionType } from '@/types/index';

interface ProductOptionState {
  productOptions: Array<ProductApiOptionType>;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;
  
  // Actions
  fetchProductOptions: () => Promise<void>;
  refreshProductOptions: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  productOptions: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
};

export const useProductOptionStore = create<ProductOptionState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        fetchProductOptions: async () => {
          // すでにデータを取得済みの場合はスキップ
          if (get().productOptions.length > 0 && get().lastFetchedAt) {
            console.log('Product options already fetched, skipping...');
            return;
          }

          set({ isLoading: true, error: null });

          try {
            const response = await http.get<Array<ProductApiOptionType>>('/product_option');
            
            set({
              productOptions: response.data,
              lastFetchedAt: new Date(),
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('Failed to fetch product options:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '商品一覧の取得に失敗しました',
            });
          }
        },

        refreshProductOptions: async () => {
          // 強制的に再取得する
          set({ isLoading: true, error: null });

          try {
            const response = await http.get<Array<ProductApiOptionType>>('/api/product_option');
            
            set({
              productOptions: response.data,
              lastFetchedAt: new Date(),
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('Failed to refresh product options:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '商品一覧の更新に失敗しました',
            });
          }
        },

        clearError: () => {
          set({ error: null });
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'product-option-storage', // localStorageのキー名
        partialize: (state) => ({ 
          productOptions: state.productOptions,
          lastFetchedAt: state.lastFetchedAt,
        }), // 永続化する部分のみ指定
      }
    ),
    {
      name: 'product-option-store',
    }
  )
);

// Selector hooks for common use cases
export const useProductOptions = () => useProductOptionStore((state) => state.productOptions);
export const useProductOptionsLoading = () => useProductOptionStore((state) => state.isLoading);
export const useProductOptionsError = () => useProductOptionStore((state) => state.error);