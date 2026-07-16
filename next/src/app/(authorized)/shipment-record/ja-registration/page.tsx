'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Save } from 'lucide-react';
import { format, eachDayOfInterval, isValid } from 'date-fns';
import Button from '@/components/ui/Button';
import DatePickerBase from '@/components/input/DatePickerBase';
import SelectBoxBase from '@/components/input/SelectBoxBase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import JaShipmentGrid from './components/JaShipmentGrid';
import useGetApi from '@/lib/api/useGetApi';
import usePostApi from '@/lib/api/usePostApi';
import { commonApiHookOptions } from '@/lib/api/commonErrorHandlers';
import { useVarietyOptionStore, useVarietyOptions } from '@/stores/useVarietyOptionStore';
import { validateJaLoadConditions, type JaLoadConditionErrors } from '@/lib/validation/jaShipment';
import { toast } from 'sonner';
import type { OptionType } from '@/types';
import type {
  GetJaShipmentDataApiResponse,
  JaGradeType,
  JaGridEntry,
  JaShipmentRegisterApiResponse,
  JaShipmentRegisterRequest,
} from '@/types/shipmentRecord';

interface LoadedCriteria {
  start: Date;
  end: Date;
  varietyId: string;
}

type PendingDiscardAction =
  | { type: 'navigate-back' }
  | { type: 'load-grid'; start: Date; end: Date; varietyId: string };

export default function JaRegistrationPage() {
  const router = useRouter();
  const { get, loading: getLoading } = useGetApi<GetJaShipmentDataApiResponse>(commonApiHookOptions);
  const { post, loading: postLoading } = usePostApi<
    JaShipmentRegisterRequest,
    JaShipmentRegisterApiResponse
  >(commonApiHookOptions);

  const fetchVarietyOptions = useVarietyOptionStore((s) => s.fetchVarietyOptions);
  const varietyOptions = useVarietyOptions();

  // 条件選択
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedVarietyId, setSelectedVarietyId] = useState<string | null>(null);
  const [conditionErrors, setConditionErrors] = useState<JaLoadConditionErrors>({});

  // グリッドデータ
  const [grades, setGrades] = useState<JaGradeType[]>([]);
  const [gridData, setGridData] = useState<JaGridEntry[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadedCriteria, setLoadedCriteria] = useState<LoadedCriteria | null>(null);
  // 未保存の変更があるか
  const [isDirty, setIsDirty] = useState(false);
  const [pendingDiscardAction, setPendingDiscardAction] =
    useState<PendingDiscardAction | null>(null);

  useEffect(() => {
    fetchVarietyOptions();
  }, [fetchVarietyOptions]);

  // 未保存の変更がある状態での離脱を警告
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // 品種セレクタ用オプション
  const varietySelectOptions: OptionType[] = varietyOptions.map((v) => ({
    label: v.label,
    value: v.value.toString(),
  }));

  // グリッド読み込み（条件は引数で受け取り、日別詳細からのプリフィル遷移でも再利用する）
  const loadGrid = useCallback(
    async (start: Date, end: Date, varietyId: string) => {
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');
      const url = `/shipment-record/ja?variety_id=${varietyId}&start_date=${startStr}&end_date=${endStr}`;

      const res = await get(url);
      if (!res.success) {
        return false;
      }

      if (!res.data.success) {
        toast.error(res.data.message);
        return false;
      }

      const { grades: fetchedGrades, entries = {} } = res.data;
      setGrades(fetchedGrades);

      // 期間内の全日付でグリッドデータを生成
      const days = eachDayOfInterval({ start, end });
      const newGridData: JaGridEntry[] = days.map((day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const existingGrades = entries[dateKey] ?? {};
        const gradeValues: Record<string, number> = {};
        fetchedGrades.forEach((grade) => {
          gradeValues[grade.id.toString()] = existingGrades[grade.id.toString()] ?? 0;
        });
        return {
          record_date: dateKey,
          grades: gradeValues,
        };
      });

      setGridData(newGridData);
      setLoadedCriteria({ start, end, varietyId });
      setIsDataLoaded(true);
      setIsDirty(false);
      return true;
    },
    [get]
  );

  // クエリパラメータからのプリフィル（日別詳細ページの「この品種を編集」導線）
  // クライアント専用ページのため window.location から直接読み取る
  const autoLoadDone = useRef(false);
  useEffect(() => {
    if (autoLoadDone.current) return;

    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    const varietyParam = params.get('variety_id');
    if (!dateParam || !varietyParam) return;

    const date = new Date(dateParam);
    if (!isValid(date)) return;

    const timeoutId = window.setTimeout(() => {
      if (autoLoadDone.current) return;
      autoLoadDone.current = true;
      setStartDate(date);
      setEndDate(date);
      setSelectedVarietyId(varietyParam);
      void loadGrid(date, date, varietyParam);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadGrid]);

  // データ読み込みボタン
  const handleLoadData = useCallback(async () => {
    const errors = await validateJaLoadConditions({
      start_date: startDate,
      end_date: endDate,
      variety_id: selectedVarietyId,
    });
    setConditionErrors(errors ?? {});
    if (errors || !startDate || !endDate || !selectedVarietyId) return;

    if (isDirty) {
      setPendingDiscardAction({
        type: 'load-grid',
        start: startDate,
        end: endDate,
        varietyId: selectedVarietyId,
      });
      return;
    }

    await loadGrid(startDate, endDate, selectedVarietyId);
  }, [endDate, isDirty, loadGrid, selectedVarietyId, startDate]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      setPendingDiscardAction({ type: 'navigate-back' });
      return;
    }

    router.push('/shipment-record');
  }, [isDirty, router]);

  const handleConfirmDiscard = useCallback(async () => {
    const action = pendingDiscardAction;
    if (!action) return;

    setPendingDiscardAction(null);
    if (action.type === 'navigate-back') {
      router.push('/shipment-record');
      return;
    }

    await loadGrid(action.start, action.end, action.varietyId);
  }, [loadGrid, pendingDiscardAction, router]);

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
    setIsDirty(true);
  }, []);

  // 一括保存: グリッドの表示状態をそのまま保存する（0を含む全セルを送信し、
  // サーバー側の置換方式により 0 にした等級は明細ごと消える）
  const handleSave = useCallback(async () => {
    if (!loadedCriteria || gridData.length === 0) return;

    const requestData: JaShipmentRegisterRequest = {
      variety_id: Number(loadedCriteria.varietyId),
      entries: gridData.map((entry) => ({
        record_date: entry.record_date,
        grades: Object.entries(entry.grades).map(([gradeId, quantity]) => ({
          grade_id: parseInt(gradeId),
          quantity,
        })),
      })),
    };

    const res = await post('/shipment-record/ja', requestData);
    if (res.success && res.data.success) {
      toast.success(res.data.message);
      // DBの最新状態でグリッドを再読込（保存済み状態へ戻す）
      await loadGrid(loadedCriteria.start, loadedCriteria.end, loadedCriteria.varietyId);
    } else if (res.success) {
      toast.error(res.data.message);
    }
  }, [gridData, loadGrid, loadedCriteria, post]);

  return (
    <div className="px-6 py-6 md:px-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleBack}
            outline
            className="!p-2"
            aria-label="出荷記録一覧へ戻る"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">JA出荷一括登録</h1>
        </div>
      </div>

      {/* 条件選択 */}
      <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/40">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          <div>
            <DatePickerBase
              name="start_date"
              inputLabel="開始日"
              value={startDate}
              onChange={setStartDate}
            />
            {conditionErrors.start_date && (
              <p className="text-sm text-[var(--error)] mt-1">{conditionErrors.start_date}</p>
            )}
          </div>
          <div>
            <DatePickerBase
              name="end_date"
              inputLabel="終了日"
              value={endDate}
              onChange={setEndDate}
            />
            {conditionErrors.end_date && (
              <p className="text-sm text-[var(--error)] mt-1">{conditionErrors.end_date}</p>
            )}
          </div>
          <div>
            <SelectBoxBase
              name="variety_id"
              inputLabel="品種"
              option={varietySelectOptions}
              value={selectedVarietyId}
              onChange={setSelectedVarietyId}
              disabledRemove
            />
            {conditionErrors.variety_id && (
              <p className="text-sm text-[var(--error)] mt-1">{conditionErrors.variety_id}</p>
            )}
          </div>
          <Button
            type="button"
            onClick={handleLoadData}
            outline
            disabled={getLoading}
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
          {loadedCriteria && (
            <p className="mb-2 text-xs text-[var(--text-muted)]">
              読み込み済み条件: {format(loadedCriteria.start, 'yyyy-MM-dd')} ～{' '}
              {format(loadedCriteria.end, 'yyyy-MM-dd')} / 品種ID {loadedCriteria.varietyId}
            </p>
          )}
          {/* 保存状態バッジ */}
          <div className="flex justify-end mb-2">
            {isDirty ? (
              <span
                className="text-xs px-2 py-1 rounded-full border font-semibold"
                style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
              >
                未保存の変更があります
              </span>
            ) : (
              <span
                className="text-xs px-2 py-1 rounded-full border"
                style={{ color: 'var(--text-muted)', borderColor: 'var(--pear-border)' }}
              >
                保存済み
              </span>
            )}
          </div>

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
              disabled={postLoading || !isDirty}
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

      <Dialog
        open={pendingDiscardAction !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPendingDiscardAction(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>未保存の変更を破棄しますか？</DialogTitle>
            <DialogDescription>
              {pendingDiscardAction?.type === 'navigate-back'
                ? '保存せずに出荷記録一覧へ戻ると、入力中のJA出荷数量は失われます。'
                : '指定した条件でデータを読み込み直すと、入力中のJA出荷数量は失われます。'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              outline
              className="w-full"
              onClick={() => setPendingDiscardAction(null)}
            >
              入力を続ける
            </Button>
            <Button
              type="button"
              color="alert"
              className="w-full"
              onClick={handleConfirmDiscard}
            >
              破棄して続行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
