import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { http } from '@/lib/api/http';
import { ApiOptionType } from '@/types';

interface GradeOptionState {
  gradeOptions: ApiOptionType[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;

  // Actions
  fetchGradeOptions: () => Promise<void>;
  refreshGradeOptions: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  gradeOptions: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
};

export const useGradeOptionStore = create<GradeOptionState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        fetchGradeOptions: async () => {
          // すでにデータを取得済みの場合はスキップ
          if (get().gradeOptions.length > 0 && get().lastFetchedAt) {
            console.log('Grade options already fetched, skipping...');
            return;
          }

          set({ isLoading: true, error: null });

          try {
            const response = await http.get<Array<ApiOptionType>>('/grade_option');

            set({
              gradeOptions: response.data,
              lastFetchedAt: new Date(),
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('Failed to fetch grade options:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '等級一覧の取得に失敗しました',
            });
          }
        },

        refreshGradeOptions: async () => {
          // 強制的に再取得する
          set({ isLoading: true, error: null });

          try {
            const response = await http.get<ApiOptionType[]>('/grade_option');

            set({
              gradeOptions: response.data,
              lastFetchedAt: new Date(),
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('Failed to refresh grade options:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '等級一覧の更新に失敗しました',
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
        name: 'grade-option-storage', // localStorageのキー名
        partialize: (state) => ({
          gradeOptions: state.gradeOptions,
          lastFetchedAt: state.lastFetchedAt,
        }), // 永続化する部分のみ指定
      }
    ),
    {
      name: 'grade-option-store',
    }
  )
);

// Selector hooks for common use cases
export const useGradeOptions = () => useGradeOptionStore((state) => state.gradeOptions);
export const useGradeOptionsLoading = () => useGradeOptionStore((state) => state.isLoading);
export const useGradeOptionsError = () => useGradeOptionStore((state) => state.error);
