'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Button from '@/components/ui/Button';
import ShipmentRecordRegisterDialog, {
  type DirectSaleEditData,
} from '../components/ShipmentRecordRegisterDialog';
import useGetApi from '@/lib/api/useGetApi';
import useDeleteApi from '@/lib/api/useDeleteApi';
import { commonApiHookOptions } from '@/lib/api/commonErrorHandlers';
import { SHIPMENT_TYPE, SHIPMENT_TYPE_OPTIONS } from '@/constants/shipmentType';
import { toast } from 'sonner';
import type {
  DailyShipment,
  DeleteShipmentRecordApiResponse,
  GetShipmentRecordDailyApiResponse,
  ShipmentRecordDaily,
} from '@/types/shipmentRecord';

const shipmentTypeLabel = (typeId: number): string =>
  SHIPMENT_TYPE_OPTIONS.find((opt) => opt.value === typeId)?.label ?? `種別${typeId}`;

export default function ShipmentRecordDailyPage() {
  const params = useParams<{ date: string }>();
  const router = useRouter();
  const date = params.date;

  const [record, setRecord] = useState<ShipmentRecordDaily | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null); // shipment_type_id

  const { get } = useGetApi<GetShipmentRecordDailyApiResponse>(commonApiHookOptions);
  const { destroy, loading: deleting } = useDeleteApi<DeleteShipmentRecordApiResponse>(commonApiHookOptions);

  const fetchDaily = useCallback(async () => {
    const res = await get(`/shipment-record/daily/${date}`);
    if (res.success && res.data.success && res.data.record) {
      setRecord(res.data.record);
      setNotFound(false);
    } else {
      setRecord(null);
      setNotFound(true);
    }
    setIsInitialLoading(false);
  }, [get, date]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDaily();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDaily]);

  const directShipment = useMemo(
    () => record?.shipments.find((s) => s.shipment_type_id === SHIPMENT_TYPE.DIRECT) ?? null,
    [record]
  );

  // 直売編集ダイアログのプリフィルデータ（商品明細を行に展開）
  const editData: DirectSaleEditData | null = useMemo(() => {
    if (!record) return null;
    const items = (directShipment?.details ?? []).flatMap((detail) =>
      detail.products.map((p) => ({
        variety_id: detail.variety_id.toString(),
        product_id: p.product_id.toString(),
        fruit_quantity: p.fruit_quantity,
        box_quantity: p.box_quantity,
      }))
    );
    const manualEntries = (directShipment?.details ?? []).map((detail) => ({
      variety_id: detail.variety_id.toString(),
      grade_id: detail.grade_id.toString(),
      quantity: detail.manual_quantity,
    }));
    return {
      record_date: record.record_date,
      notes: record.notes ?? '',
      direct_sale_items: items,
      manual_grade_entries: manualEntries,
    };
  }, [record, directShipment]);

  // 種別単位削除
  const handleDelete = async () => {
    if (deleteTarget === null) return;
    const res = await destroy(`/shipment-record/daily/${date}/${deleteTarget}`);
    if (res.success && res.data.success) {
      setDeleteTarget(null);
      toast.success(res.data.message);
      if (res.data.record_deleted) {
        // その日のデータが全て消えたら一覧へ戻る
        router.push('/shipment-record');
        return;
      }
      fetchDaily();
    } else if (res.success && !res.data.success) {
      toast.error(res.data.message);
    }
  };

  const formatDisplayDate = (dateStr: string): string => {
    return format(new Date(dateStr), 'yyyy年M月d日 (E)', { locale: ja });
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen pear-bg flex items-center justify-center">
        <div className="pear-spinner"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 md:px-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => router.push('/shipment-record')}
            outline
            className="!p-2"
            aria-label="出荷記録一覧へ戻る"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">{formatDisplayDate(date)} の出荷記録</h1>
        </div>
      </div>

      {notFound && (
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-12 border border-white/40 text-center text-gray-400">
          この日の出荷記録はありません
        </div>
      )}

      {record && (
        <div className="space-y-6">
          {/* 備考 */}
          {record.notes && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                備考
              </div>
              <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
            </div>
          )}

          {/* 出荷種別ごとのセクション */}
          {SHIPMENT_TYPE_OPTIONS.map((typeOption) => {
            const shipment = record.shipments.find(
              (s) => s.shipment_type_id === typeOption.value
            );
            const isDirect = typeOption.value === SHIPMENT_TYPE.DIRECT;

            return (
              <ShipmentTypeSection
                key={typeOption.value}
                typeId={typeOption.value}
                label={typeOption.label}
                shipment={shipment ?? null}
                onEdit={
                  isDirect
                    ? () => setEditOpen(true)
                    : undefined
                }
                onEditJaVariety={
                  !isDirect
                    ? (varietyId) =>
                        router.push(
                          `/shipment-record/ja-registration?date=${date}&variety_id=${varietyId}`
                        )
                    : undefined
                }
                onDelete={shipment ? () => setDeleteTarget(typeOption.value) : undefined}
              />
            );
          })}
        </div>
      )}

      {/* 直売編集ダイアログ */}
      {editData && (
        <ShipmentRecordRegisterDialog
          editData={editData}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={fetchDaily}
        />
      )}

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteTarget !== null ? shipmentTypeLabel(deleteTarget) : ''}のデータを削除
            </DialogTitle>
            <DialogDescription>
              {formatDisplayDate(date)} の{deleteTarget !== null ? shipmentTypeLabel(deleteTarget) : ''}
              データをすべて削除します。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" outline className="w-full" onClick={() => setDeleteTarget(null)}>
              キャンセル
            </Button>
            <Button
              type="button"
              color="alert"
              className="w-full"
              onClick={handleDelete}
              disabled={deleting}
            >
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ShipmentTypeSectionProps {
  typeId: number;
  label: string;
  shipment: DailyShipment | null;
  onEdit?: () => void;
  onEditJaVariety?: (varietyId: number) => void;
  onDelete?: () => void;
}

function ShipmentTypeSection({
  typeId,
  label,
  shipment,
  onEdit,
  onEditJaVariety,
  onDelete,
}: ShipmentTypeSectionProps) {
  const isDirect = typeId === SHIPMENT_TYPE.DIRECT;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
      {/* セクションヘッダー */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold">{label}</h2>
          {shipment && (
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              合計 {shipment.total_quantity.toLocaleString()} 個
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button type="button" outline onClick={onEdit} className="!px-3 !py-2 !text-sm">
              <Pencil size={14} />
              {label}を編集
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              color="alert"
              outline
              onClick={onDelete}
              className="!px-3 !py-2 !text-sm"
            >
              <Trash2 size={14} />
              削除
            </Button>
          )}
        </div>
      </div>

      {!shipment && (
        <div className="text-sm text-gray-400 py-4 text-center">
          {label}のデータはありません
        </div>
      )}

      {shipment && (
        <div className="space-y-4">
          {shipment.details.map((detail) => (
            <div
              key={`${detail.variety_id}-${detail.grade_id}`}
              className="border rounded-lg p-3"
              style={{ borderColor: 'var(--pear-border)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{detail.variety_name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border"
                    style={{ borderColor: 'var(--pear-border)', color: 'var(--text-muted)' }}
                  >
                    {detail.grade_name}
                  </span>
                  <span className="text-sm">{detail.quantity.toLocaleString()} 個</span>
                </div>
                {onEditJaVariety && (
                  <Button
                    type="button"
                    outline
                    onClick={() => onEditJaVariety(detail.variety_id)}
                    className="!px-3 !py-1.5 !text-xs"
                  >
                    <Pencil size={12} />
                    この品種を編集
                  </Button>
                )}
              </div>

              {isDirect && (
                <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                  <span>商品由来: {detail.product_quantity.toLocaleString()} 個</span>
                  <span>商品外: {detail.manual_quantity.toLocaleString()} 個</span>
                </div>
              )}

              {/* 直売: 商品明細テーブル */}
              {isDirect && detail.products.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="shipment-record-table w-full">
                    <thead>
                      <tr>
                        <th>商品名</th>
                        <th style={{ textAlign: 'right' }}>玉数</th>
                        <th style={{ textAlign: 'right' }}>箱/袋数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.products.map((p, i) => (
                        <tr key={`${p.product_id}-${i}`}>
                          <td>{p.product_name}</td>
                          <td style={{ textAlign: 'right' }}>{p.fruit_quantity}</td>
                          <td style={{ textAlign: 'right' }}>{p.box_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
