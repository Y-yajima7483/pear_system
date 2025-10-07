'use client';

import { useLayoutEffect, useRef, useState } from "react";
import type { UseFormTrigger, FieldValues, FieldPath } from "react-hook-form";

export interface Props<TextAreaValues extends FieldValues> {
	name: FieldPath<TextAreaValues>;
	inputLabel: string;
	errorMessage?: string;
	onChange?: (value: string) => void;
	trigger?: UseFormTrigger<TextAreaValues>;
	defaultValue?: string;
	value?: string;
	rows?: number;
	cols?: number;
	maxLength?: number;
	placeholder?: string;
	resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

export default function TextAreaBase<TextAreaValues extends FieldValues>({
	name,
	inputLabel,
	errorMessage,
	onChange,
	trigger,
	defaultValue,
	value,
	rows = 4,
	cols,
	maxLength,
	placeholder,
	resize = 'vertical'
}: Props<TextAreaValues>) {
	const suffixRef = useRef<HTMLSpanElement | null>(null);
  const [suffixPaddingPx, setSuffixPaddingPx] = useState(0);

	return (
		<div className={`text-area ${errorMessage ? "error" : ""}`}>
			<textarea
				id={`text-area-${name}`}
				placeholder={inputLabel}
				defaultValue={defaultValue}
				value={value}
				onChange={(event) => {
					if (onChange) onChange(event.currentTarget.value);
					if (trigger) trigger(name);
				}}
				rows={rows}
				cols={cols}
				maxLength={maxLength}
			/>
			<label htmlFor={`text-area-${name}`}>{inputLabel}</label>
			{!!errorMessage && <p>{errorMessage}</p>}
		</div>
	);
}