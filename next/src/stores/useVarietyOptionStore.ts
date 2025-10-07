import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { http } from '@/lib/api/http';
import { ApiOptionType } from '@/types';

interface VarietyOptionState {
  varietyOptions: ApiOptionType[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;
  
  // Actions
  fetchVarietyOptions: () => Promise<void>;
  refreshVarietyOptions: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  varietyOptions: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
};

export const useVarietyOptionStore = create<VarietyOptionState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        fetchVarietyOptions: async () => {
          // すでにデータを取得済みの場合はスキップ
          if (get().varietyOptions.length > 0 && get().lastFetchedAt) {
            console.log('Variety options already fetched, skipping...');
            return;
          }

          set({ isLoading: true, error: null });

          try {
            const response = await http.get<Array<ApiOptionType>>('/variety_option');
            
            set({
              varietyOptions: response.data,
              lastFetchedAt: new Date(),
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('Failed to fetch variety options:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '品種一覧の取得に失敗しました',
            });
          }
        },

        refreshVarietyOptions: async () => {
          // 強制的に再取得する
          set({ isLoading: true, error: null });

          try {
            const response = await http.get<ApiOptionType[]>('/api/variety_option');
            
            set({
              varietyOptions: response.data,
              lastFetchedAt: new Date(),
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('Failed to refresh variety options:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '品種一覧の更新に失敗しました',
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
        name: 'variety-option-storage', // localStorageのキー名
        partialize: (state) => ({ 
          varietyOptions: state.varietyOptions,
          lastFetchedAt: state.lastFetchedAt,
        }), // 永続化する部分のみ指定
      }
    ),
    {
      name: 'variety-option-store',
    }
  )
);

// Selector hooks for common use cases
export const useVarietyOptions = () => useVarietyOptionStore((state) => state.varietyOptions);
export const useVarietyOptionsLoading = () => useVarietyOptionStore((state) => state.isLoading);
export const useVarietyOptionsError = () => useVarietyOptionStore((state) => state.error);