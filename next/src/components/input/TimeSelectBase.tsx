"use client";

import React, { useEffect, useRef } from "react";
import type { FieldValues, UseFormTrigger, FieldPath } from "react-hook-form";

interface Props<ESFieldValues extends FieldValues> {
  name: FieldPath<ESFieldValues>;
  inputLabel?: string;
  errorMessage?: string;
  onChange?: (value: string | null) => void;
  trigger?: UseFormTrigger<ESFieldValues>;
  value?: string | null;
  min?: string; // HH:mm format
  max?: string; // HH:mm format
}

export default function TimeSelectBase<ESFieldValues extends FieldValues>({
  name,
  inputLabel,
  errorMessage,
  onChange,
  trigger,
  value,
  min = "07:00",
  max = "21:00",
}: Props<ESFieldValues>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previousValueRef = useRef(value || "");

  useEffect(() => {
    previousValueRef.current = value || "";
  }, [value]);

  // 15分刻みに丸める関数
  const roundToQuarterHour = (time: string): string => {
    if (!time) return "";
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const roundedMinutes = Math.round(totalMinutes / 15) * 15;
    
    const newHours = Math.floor(roundedMinutes / 60);
    const newMinutes = roundedMinutes % 60;
    
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };

  const isValidHour = (hour: string): boolean => {
    if (!/^\d{2}$/.test(hour)) return false;

    const hourNumber = Number(hour);
    const minHour = Number(min.split(':')[0]);
    const maxHour = Number(max.split(':')[0]);

    return hourNumber >= minHour && hourNumber <= maxHour;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    
    if (!rawValue) {
      previousValueRef.current = "";
      onChange?.(null);
      trigger?.(name);
      return;
    }

    const [hour] = rawValue.split(':');
    const [previousHour] = previousValueRef.current.split(':');
    const hourWasChanged = hour !== previousHour;

    // HHが入力・変更された場合は、分を00に初期化する
    const normalizedValue = hourWasChanged && isValidHour(hour)
      ? `${hour}:00`
      : roundToQuarterHour(rawValue);
    
    // 値を設定
    if (inputRef.current) {
      inputRef.current.value = normalizedValue;
    }
    
    previousValueRef.current = normalizedValue;
    onChange?.(normalizedValue);
    trigger?.(name);
  };

  return (
    <div className={`text-field ${errorMessage ? "error" : ""}`}>
      <input
        ref={inputRef}
        type="time"
        id={`time-field-${name}`}
        placeholder={inputLabel}
        value={value || ""}
        onChange={handleChange}
        step="900" // 15分刻み（15分 = 900秒）
        min={min}
        max={max}
      />
      <label htmlFor={`time-field-${name}`}>{inputLabel}</label>
      {!!errorMessage && <p>{errorMessage}</p>}
    </div>
  );
}
