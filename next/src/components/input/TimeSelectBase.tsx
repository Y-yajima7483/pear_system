"use client";

import React, { useRef } from "react";
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    
    if (!rawValue) {
      onChange?.(null);
      trigger?.(name);
      return;
    }

    // 15分刻みに丸める
    const roundedValue = roundToQuarterHour(rawValue);
    
    // 値を設定
    if (inputRef.current) {
      inputRef.current.value = roundedValue;
    }
    
    onChange?.(roundedValue);
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