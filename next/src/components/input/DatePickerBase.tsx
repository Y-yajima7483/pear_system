
'use client';

import * as React from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { FieldValues, FieldPath, UseFormTrigger } from 'react-hook-form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, X as XIcon } from 'lucide-react';

export interface DatePickerBaseProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  inputLabel: string;
  value?: Date | null;
  onChange?: (value: Date | null) => void;
  errorMessage?: string;
  trigger?: UseFormTrigger<TFieldValues>;
  disabled?: boolean;
}

export default function DatePicker<TFieldValues extends FieldValues>({
  name,
  inputLabel,
  value = null,
  onChange,
  errorMessage,
  trigger,
  disabled,
}: DatePickerBaseProps<TFieldValues>) {
  const [open, setOpen] = useState(false);

  // 表示テキスト（floating labelのために input 自体の placeholder は空文字に）
  const display = value ? format(value, 'yyyy年MM月dd日') : '';

  return (
    <div className={`date-picker ${errorMessage ? "error" : ""}`}>
      {/* 見た目は input、クリックでPopoverを開く */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-auto">
            <input
              id={`date-field-${name}`}
              placeholder={inputLabel}
              aria-invalid={!!errorMessage || undefined}
              disabled={disabled}
              className="date-picker-input"
              value={display}
              onChange={(event) => {
                event.currentTarget.value
                if (onChange) onChange(new Date (event.currentTarget.value));
                if (trigger) trigger(name);

              }}
            />
            <label
              htmlFor={`date-field-${name}`}
              className="date-picker-label"
            >
              {inputLabel}
            </label>
            <span className="date-filed-button">
              {value && !disabled ? (
                <XIcon
                  className="remove-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onChange) onChange(null);
                    trigger?.(name);
                  }}
                />
              ) : null}
              <CalendarIcon className="calendar-icon" />
            </span>
          </div>
        </PopoverTrigger>

        {/* エラーメッセージ */}
        {!!errorMessage && (
          <p className="date-picker-error">{errorMessage}</p>
        )}

        <PopoverContent className="w-[35vw] max-w-[400px] p-0" align="start">
          <Calendar
            className="w-full"
            mode="single"
            selected={value ?? undefined}
            onSelect={(d) => {
              onChange?.(d ?? null);
              trigger?.(name);
              setOpen(false);
            }}
            locale={ja}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
