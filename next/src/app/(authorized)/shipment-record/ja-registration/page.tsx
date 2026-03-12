'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Save } from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import Button from '@/components/ui/Button';
import DatePickerBase from '@/components/input/DatePickerBase';
import SelectBoxBase from '@/components/input/SelectBoxBase';
import JaShipmentGrid from './components/JaShipmentGrid';
import useGetApi from '@/lib/api/useGetApi';
import usePostApi from '@/lib/api/usePostApi';
import { commonApiHookOptions } from '@/lib/api/commonErrorHandlers';
import { useVarietyOptionStore, useVarietyOptions } from '@/stores/useVarietyOptionStore';
import { useGradeOptionStore } from '@/stores/useGradeOptionStore';
import { toast } from 'sonner';
import type { OptionType } from '@/types';
import type {
  GetJaShipmentDataApiResponse,
  JaGradeType,
  JaGridEntry,
  JaShipmentRegisterRequest,
} from '@/types/shipmentRecord';

export default function JaRegistrationPage() {
  const router = useRouter();
  const { get, loading: getLoading } = useGetApi<GetJaShipmentDataApiResponse>(commonApiHookOptions);
  const { post, loading: postLoading } = usePostApi(commonApiHookOptions);

  const fetchVarietyOptions = useVarietyOptionStore((s) => s.fetchVarietyOptions);
  const fetchGradeOptions = useGradeOptionStore((s) => s.fetchGradeOptions);
  const varietyOptions = useVarietyOptions();

  // 条件選択
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedVarietyId, setSelectedVarietyId] = useState<string | null>(null);

  // グリッドデータ
  const [grades, setGrades] = useState<JaGradeType[]>([]);
  const [gridData, setGridData] = useState<JaGridEntry[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    fetchVarietyOptions();
    fetchGradeOptions();
  }, [fetchVarietyOptions, fetchGradeOptions]);

  // 品種セレクタ用オプション
  const varietySelectOptions: OptionType[] = varietyOptions.map((v) => ({
    label: v.label,
    value: v.value.toString(),
  }));

  // データ読み込み
  const handleLoadData = useCallback(async () => {
    if (!startDate || !endDate || !selectedVarietyId) {
      toast.error('期間と品種を選択してください');
      return;
    }

    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    const url = `/shipment-record/ja?variety_id=${selectedVarietyId}&start_date=${startStr}&end_date=${endStr}`;

    const res = await get(url);
    if (res.success && res.data) {
      const { grades: fetchedGrades, entries = {} } = res.data;
      setGrades(fetchedGrades);

      // 期間内の全日付でグリッドデータを生成
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const newGridData: JaGridEntry[] = days.map((day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const existingGrades = entries[dateKey] ?? {};
        const gradeValues: Record<string, number> = {};
        fetchedGrades.forEach((g) => {
          gradeValues[g.id.toString()] = existingGrades[g.id.toString()] ?? 0;
        });
        return {
          record_date: dateKey,
          grades: gradeValues,
        };
      });

      setGridData(newGridData);
      setIsDataLoaded(true);
    }
  }, [startDate, endDate, selectedVarietyId, get]);

  // セル値変更
  const handleCellChange = useCallback((dateIndex: number, gradeId: string, value: number) => {
    setGridData((prev) => {
      const updated = [...prev];
      updated[dateIndex] = {
        ...updated[dateIndex],
        grades: {
          ...updated[dateIndex].grades,
          [gradeId]: value,
        },
      };
      return updated;
    });
  }, []);

  // 一括保存
  const handleSave = useCallback(async () => {
    if (!selectedVarietyId || gridData.length === 0) return;

    // 数量が入力されているエントリのみ送信
    const entriesWithData = gridData.filter((entry) =>
      Object.values(entry.grades).some((qty) => qty > 0)
    );

    if (entriesWithData.length === 0) {
      toast.error('少なくとも1つの数量を入力してください');
      return;
    }

    const requestData: JaShipmentRegisterRequest = {
      variety_id: parseInt(selectedVarietyId),
      entries: entriesWithData.map((entry) => ({
        record_date: entry.record_date,
        grades: Object.entries(entry.grades)
          .filter(([_, qty]) => qty > 0)
          .map(([gradeId, quantity]) => ({
            grade_id: parseInt(gradeId),
            quantity,
          })),
      })),
    };

    const res = await post('/shipment-record/ja', requestData);
    if (res.success) {
      toast.success('JA出荷記録を保存しました');
    }
  }, [selectedVarietyId, gridData, post]);

  return (
    <div className="px-6 py-6 md:px-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/shipment-record')}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">JA出荷一括登録</h1>
        </div>
      </div>

      {/* 条件選択 */}
      <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/40">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <DatePickerBase
            name="start_date"
            inputLabel="開始日"
            value={startDate}
            onChange={setStartDate}
          />
          <DatePickerBase
            name="end_date"
            inputLabel="終了日"
            value={endDate}
            onChange={setEndDate}
          />
          <SelectBoxBase
            name="variety_id"
            inputLabel="品種"
            option={varietySelectOptions}
            value={selectedVarietyId}
            onChange={setSelectedVarietyId}
            disabledRemove
          />
          <Button
            type="button"
            onClick={handleLoadData}
            outline
            disabled={!startDate || !endDate || !selectedVarietyId || getLoading || endDate < startDate}
            className="!py-2.5"
          >
            <Download size={16} />
            データ読み込み
          </Button>
        </div>
      </div>

      {/* グリッド */}
      {isDataLoaded && (
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
          <JaShipmentGrid
            grades={grades}
            gridData={gridData}
            onCellChange={handleCellChange}
          />

          {/* 保存ボタン */}
          <div className="flex justify-end mt-4">
            <Button
              type="button"
              onClick={handleSave}
              disabled={postLoading}
              className="!px-8"
            >
              <Save size={16} />
              一括保存
            </Button>
          </div>
        </div>
      )}

      {/* 未読み込み時 */}
      {!isDataLoaded && (
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-12 border border-white/40 text-center text-gray-400">
          期間と品種を選択して「データ読み込み」を押してください
        </div>
      )}
    </div>
  );
}
