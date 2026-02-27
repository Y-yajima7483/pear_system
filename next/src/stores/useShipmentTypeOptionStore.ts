import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { http } from '@/lib/api/http';
import { ApiOptionType } from '@/types';

interface ShipmentTypeOptionState {
  shipmentTypeOptions: ApiOptionType[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;

  // Actions
  fetchShipmentTypeOptions: () => Promise<void>;
  refreshShipmentTypeOptions: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  shipmentTypeOptions: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
};

export const useShipmentTypeOptionStore = create<ShipmentTypeOptionState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        fetchShipmentTypeOptions: async () => {
          // すでにデータを取得済みの場合はスキップ
          if (get().shipmentTypeOptions.length > 0 && get().lastFetchedAt) {
            console.log('Shipment type options already fetched, skipping...');
            return;
          }

          set({ isLoading: true, error: null });

          try {
            const response = await http.get<Array<ApiOptionType>>('/shipment_type_option');

            set({
              shipmentTypeOptions: response.data,
              lastFetchedAt: new Date(),
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('Failed to fetch shipment type options:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '出荷タイプ一覧の取得に失敗しました',
            });
          }
        },

        refreshShipmentTypeOptions: async () => {
          // 強制的に再取得する
          set({ isLoading: true, error: null });

          try {
            const response = await http.get<ApiOptionType[]>('/shipment_type_option');

            set({
              shipmentTypeOptions: response.data,
              lastFetchedAt: new Date(),
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('Failed to refresh shipment type options:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '出荷タイプ一覧の更新に失敗しました',
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
        name: 'shipment-type-option-storage', // localStorageのキー名
        partialize: (state) => ({
          shipmentTypeOptions: state.shipmentTypeOptions,
          lastFetchedAt: state.lastFetchedAt,
        }), // 永続化する部分のみ指定
      }
    ),
    {
      name: 'shipment-type-option-store',
    }
  )
);

// Selector hooks for common use cases
export const useShipmentTypeOptions = () => useShipmentTypeOptionStore((state) => state.shipmentTypeOptions);
export const useShipmentTypeOptionsLoading = () => useShipmentTypeOptionStore((state) => state.isLoading);
export const useShipmentTypeOptionsError = () => useShipmentTypeOptionStore((state) => state.error);
