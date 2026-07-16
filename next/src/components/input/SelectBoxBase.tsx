'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { FieldPath, FieldValues, UseFormTrigger } from 'react-hook-form';
import type { OptionType } from '@/types/index';

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

export default function SelectBoxBase<
  ESFieldValues extends FieldValues,
  T extends ValueType = string,
>(props: Props<ESFieldValues, T>) {
  const {
    name,
    inputLabel,
    option,
    onChange,
    trigger,
    errorMessage,
    value: propValue,
    disabledRemove = false,
  } = props;
  const isControlled = Object.prototype.hasOwnProperty.call(props, 'value');
  const [uncontrolledValue, setUncontrolledValue] = useState<T | null>(propValue ?? null);
  const value = isControlled ? (propValue ?? null) : uncontrolledValue;
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const generatedId = useId();
  const triggerId = `select-trigger-${generatedId}`;
  const listboxId = `select-listbox-${generatedId}`;
  const selectRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedIndex = option.findIndex((item) => item.value === value);
  const selectedOption = selectedIndex >= 0 ? option[selectedIndex] : undefined;

  const focusOption = (index: number) => {
    if (option.length === 0) return;
    const nextIndex = Math.min(Math.max(index, 0), option.length - 1);
    setActiveIndex(nextIndex);
    window.requestAnimationFrame(() => optionRefs.current[nextIndex]?.focus());
  };

  const openList = (preferredIndex?: number) => {
    const nextIndex = preferredIndex ?? (selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
    setIsFocused(true);
    focusOption(nextIndex);
  };

  const closeList = (focusTrigger = false) => {
    setIsOpen(false);
    setActiveIndex(-1);
    if (focusTrigger) {
      triggerRef.current?.focus();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (selectedValue: T) => {
    if (!isControlled) {
      setUncontrolledValue(selectedValue);
    }
    onChange?.(selectedValue);
    void trigger?.(name);
    closeList(true);
  };

  const handleClear = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isControlled) {
      setUncontrolledValue(null);
    }
    onChange?.(null);
    void trigger?.(name);
    closeList(true);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        openList(selectedIndex >= 0 ? selectedIndex : 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        openList(selectedIndex >= 0 ? selectedIndex : option.length - 1);
        break;
      case 'Home':
        event.preventDefault();
        openList(0);
        break;
      case 'End':
        event.preventDefault();
        openList(option.length - 1);
        break;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          closeList(true);
        }
        break;
    }
  };

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusOption(index === option.length - 1 ? 0 : index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusOption(index <= 0 ? option.length - 1 : index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusOption(0);
        break;
      case 'End':
        event.preventDefault();
        focusOption(option.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        closeList(true);
        break;
    }
  };

  const handleContainerBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsFocused(false);
      closeList(false);
    }
  };

  return (
    <div
      className={`select-field ${errorMessage ? 'error' : ''}`}
      ref={selectRef}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={handleContainerBlur}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className={`select-trigger ${selectedOption ? 'has-value' : ''} ${
          selectedOption && !disabledRemove ? 'has-clear' : ''
        } ${isFocused ? 'focus' : ''}`}
        onClick={() => (isOpen ? closeList(false) : openList())}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={`${inputLabel}: ${selectedOption?.label ?? '未選択'}`}
      >
        <span className={`select-value ${!selectedOption ? 'placeholder' : ''}`}>
          {selectedOption?.label || inputLabel}
        </span>
        <ChevronDown className="select-icon" aria-hidden="true" />
      </button>

      <label
        htmlFor={triggerId}
        className={isFocused ? 'focus' : value !== null && value !== '' ? 'selected' : ''}
      >
        {inputLabel}
      </label>

      {isOpen && (
        <div id={listboxId} className="select-dropdown" role="listbox" aria-label={`${inputLabel}の選択肢`}>
          {option.length === 0 && (
            <div className="select-option" role="option" aria-selected="false" aria-disabled="true">
              選択肢がありません
            </div>
          )}
          {option.map((item, index) => (
            <button
              key={String(item.value)}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              id={`${listboxId}-option-${index}`}
              type="button"
              className="select-option"
              role="option"
              tabIndex={index === activeIndex ? 0 : -1}
              aria-selected={item.value === value}
              data-active={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              onClick={() => handleSelect(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {selectedOption && !disabledRemove && (
        <button
          type="button"
          className="select-clear-btn"
          tabIndex={isOpen ? -1 : 0}
          aria-label={`${inputLabel}の選択を解除`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleClear}
        >
          <X className="select-clear-icon" aria-hidden="true" />
        </button>
      )}

      {!!errorMessage && <p>{errorMessage}</p>}
    </div>
  );
}
