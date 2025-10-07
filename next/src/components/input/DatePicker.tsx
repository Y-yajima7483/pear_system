'use client';

import * as React from 'react';
import { Controller, type FieldValues, type Control, type UseFormTrigger, type FieldPath } from 'react-hook-form';
import DatePickerBase, { type DatePickerBaseProps } from './DatePickerBase';

interface Props<TFieldValues extends FieldValues>
  extends Omit<
    DatePickerBaseProps<TFieldValues>,
    'value' | 'onChange' | 'trigger'
  > {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  trigger: UseFormTrigger<TFieldValues>;
  defaultValue?: Date | null;
}

export default function DatePicker<TFieldValues extends FieldValues>({
  name,
  control,
  trigger,
  defaultValue = null,
  ...baseProps
}: Props<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue as any}
      render={({ field }) => (
        <DatePickerBase
          {...baseProps}
          name={name}
          value={field.value ?? null}
          onChange={(d) => field.onChange(d)}
          trigger={trigger}
        />
      )}
    />
  );
}
