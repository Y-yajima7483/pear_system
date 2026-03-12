'use client';

import { Control, FieldErrors, UseFormTrigger } from 'react-hook-form';
import TextArea from '@/components/input/TextArea';
import DirectSaleItems from './DirectSaleItems';
import type { DirectSaleFormInputs } from '@/types/shipmentRecord';

interface ShipmentRecordFormProps {
  control: Control<DirectSaleFormInputs>;
  errors: FieldErrors<DirectSaleFormInputs>;
  trigger: UseFormTrigger<DirectSaleFormInputs>;
}

export default function ShipmentRecordForm({
  control,
  errors,
  trigger,
}: ShipmentRecordFormProps) {
  return (
    <div className="form-area space-y-6 p-4">
      {/* 直売商品入力セクション */}
      <DirectSaleItems control={control} errors={errors} />

      {/* 備考 */}
      <div className="shipment-notes-area">
        <TextArea
          control={control}
          name="notes"
          inputLabel="備考"
          trigger={trigger}
          errorMessage={errors.notes?.message}
        />
      </div>
    </div>
  );
}
