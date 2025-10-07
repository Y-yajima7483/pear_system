
'use client';

import { useLayoutEffect, useRef, useState } from "react";
import type { UseFormTrigger, FieldValues, FieldPath } from "react-hook-form";

export interface Props<TextFieldValues extends FieldValues> {
	type: "text" | "password" | "email" |"number";
	name: FieldPath<TextFieldValues>;
	inputLabel: string;
	errorMessage?: string;
	onChange?: (value: string) => void;
	trigger?: UseFormTrigger<TextFieldValues>;
	suffix?: string;
	defaultValue?: string | number;
	value?: string;
}

export default function TextFieldBase<TextFieldValues extends FieldValues>({
	type,
	name,
	inputLabel,
	errorMessage,
	onChange,
	trigger,
	suffix,
	defaultValue,
	value
}: Props<TextFieldValues>) {
	const suffixRef = useRef<HTMLSpanElement | null>(null);
  const [suffixPaddingPx, setSuffixPaddingPx] = useState(0);

  // suffix の幅を計測して、入力の右パディングに反映
  useLayoutEffect(() => {
    if (!suffix) {
      setSuffixPaddingPx(0);
      return;
    }
    const measure = () => {
      const w = suffixRef.current?.getBoundingClientRect().width ?? 0;
      // 右端の余白（テキストと suffix の間のクッション）を +8px
      setSuffixPaddingPx(w + 8);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [suffix]);

	return (
		<div className={`text-field ${errorMessage ? "error" : ""}`}>
			<input
				type={type}
				id={`text-field-${name}`}
				placeholder={inputLabel}
				defaultValue={defaultValue}
				value={value}
				onChange={(event) => {
					if (onChange) onChange(event.currentTarget.value);
					if (trigger) trigger(name);

				}}
				style={suffix ? { paddingRight: `calc(var(--pad) + ${suffixPaddingPx}px)` } : undefined}
			/>
			<label htmlFor={`text-field-${name}`}>{inputLabel}</label>
			{!!errorMessage && <p>{errorMessage}</p>}
			{suffix && (
        <span
					ref={suffixRef}
          className="text-field__suffix"
          aria-hidden="true"
        >
          {suffix}
        </span>

      )}
		</div>
	);
}
