"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import type { FieldValues, UseFormTrigger, FieldPath } from "react-hook-form";
import { OptionType } from "@/types/index";

type ValueType = string | number;

interface Props<ESFieldValues extends FieldValues, T extends ValueType = string> {
  name: FieldPath<ESFieldValues>;
  inputLabel: string;
  errorMessage?: string;
  option: Array<OptionType<T>>;
  onChange?: (value: T | null) => void;
  trigger?: UseFormTrigger<ESFieldValues>;
  value?: T | null;
  disabledRemove?: boolean;
}

export default function SelectBoxBase<ESFieldValues extends FieldValues, T extends ValueType = string>({
  name,
  inputLabel,
  option,
  errorMessage,
  onChange,
  trigger,
  value: propValue,
  disabledRemove = false,
}: Props<ESFieldValues, T>) {
  const [value, setValue] = useState<T | null>(propValue ?? null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const selectRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Update internal state when prop value changes
  useEffect(() => {
    setValue(propValue ?? null);
  }, [propValue]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (selectedValue: T) => {
    setValue(selectedValue);
    onChange?.(selectedValue);
    trigger?.(name);
    setIsOpen(false);
    setIsFocused(false);
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setValue(null);
    onChange?.(null);
    trigger?.(name);
    setIsOpen(false);
		setIsFocused(false);
  };

  const selectedOption = option.find((opt) => opt.value === value);

  return (
    <div className={`select-field ${errorMessage ? "error" : ""}`} ref={selectRef}>
      <div
        ref={triggerRef}
        className={`select-trigger ${selectedOption ? "has-value" : isFocused ? "focus": ""}`}
        onClick={() => {
          setIsOpen(!isOpen);
          setIsFocused(false);
        }}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          if (!selectRef.current?.contains(e.relatedTarget as Node)) {
            setIsFocused(false);
          }
        }}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={inputLabel}
      >
        <span className={`select-value ${!selectedOption ? "placeholder" : ""}`}>
          {selectedOption?.label || inputLabel}
        </span>
				{(selectedOption && !disabledRemove) && (
          <button
            type="button"
            className="select-clear-btn"
            aria-label="Clear selection"
            // mousedown 時にフォーカスがボタンへ移って blur が走るのを防ぐ
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
          >
            <X className="select-clear-icon" aria-hidden="true" />
          </button>
        )}
        <ChevronDown className="select-icon" />
      </div>

      <label
        htmlFor={`select-field-${name}`}
        className={isFocused ? "focus": `${(value !== null && value !== '')?'selected':''}`}
      >
        {inputLabel}
      </label>
      {isOpen && (
        <div className="select-dropdown" role="listbox">
          {option.map((item) => (
            <div
              key={String(item.value)}
              className="select-option"
              role="option"
              aria-selected={item.value === value}
              onClick={() => handleSelect(item.value)}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}

      {!!errorMessage && <p>{errorMessage}</p>}
    </div>
  );
}
