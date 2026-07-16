'use client';

import { useEffect, useRef } from "react";
import type { FieldValues, FieldPath } from "react-hook-form";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Props<StepperValues extends FieldValues> {
	name: FieldPath<StepperValues>;
	label?: string;
	value?: number;
	onChange?: (value: number) => void;
	errorMessage?: string;
	unit?: string;
	min?: number;
	max?: number;
	step?: number;
	required?: boolean;
	disabled?: boolean;
	accessibleLabel?: string;
}

export default function NumberStepperBase<StepperValues extends FieldValues>({
	name,
	label,
	value = 0,
	onChange,
	errorMessage,
	unit,
	min,
	max,
	step = 1,
	required,
	disabled,
	accessibleLabel,
}: Props<StepperValues>) {
	const inputRef = useRef<HTMLInputElement>(null);
	const lastValidInputRef = useRef(String(value));
	const accessibleName = accessibleLabel ?? label ?? String(name);

	useEffect(() => {
		const input = inputRef.current;
		if (!input) return;

		const nextValue = String(value);
		input.value = nextValue;
		lastValidInputRef.current = nextValue;
	}, [value]);

	const isMinReached = min !== undefined && value <= min;
	const isMaxReached = max !== undefined && value >= max;

	const handleDecrement = () => {
		if (disabled || isMinReached) return;
		const next = value - step;
		onChange?.(min !== undefined ? Math.max(min, next) : next);
	};

	const handleIncrement = () => {
		if (disabled || isMaxReached) return;
		const next = value + step;
		onChange?.(max !== undefined ? Math.min(max, next) : next);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.currentTarget.value;
		if (rawValue === "") return;

		if (!/^\d+$/.test(rawValue)) {
			e.currentTarget.value = lastValidInputRef.current;
			return;
		}

		const nextValue = Number(rawValue);
		lastValidInputRef.current = rawValue;
		const isBelowMin = min !== undefined && nextValue < min;
		const isAboveMax = max !== undefined && nextValue > max;
		if (isBelowMin || isAboveMax) return;

		// Enterによるblur前submitでも、RHF側には常に最新の有効値を渡す。
		onChange?.(nextValue);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== "Enter" || e.currentTarget.value === "") return;

		let nextValue = Number(e.currentTarget.value);
		if (Number.isNaN(nextValue)) return;
		if (min !== undefined) nextValue = Math.max(min, nextValue);
		if (max !== undefined) nextValue = Math.min(max, nextValue);
		e.currentTarget.value = String(nextValue);
		lastValidInputRef.current = String(nextValue);
		onChange?.(nextValue);
	};

	const handleBlur = () => {
		const input = inputRef.current;
		if (!input) return;

		if (input.value === "" || Number.isNaN(Number(input.value))) {
			input.value = String(value);
			lastValidInputRef.current = String(value);
			return;
		}
		let num = Number(input.value);
		if (min !== undefined) num = Math.max(min, num);
		if (max !== undefined) num = Math.min(max, num);
		input.value = String(num);
		lastValidInputRef.current = String(num);
		onChange?.(num);
	};

	return (
		<div className={cn("number-stepper", errorMessage && "error")}>
			{label && (
				<label htmlFor={`stepper-${name}`} className="number-stepper__label">
					{label}
					{required && <span className="number-stepper__required">*</span>}
				</label>
			)}
			<div className="number-stepper__body">
				<button
					type="button"
					className="number-stepper__btn number-stepper__btn--minus"
					onClick={handleDecrement}
					disabled={disabled || isMinReached}
					aria-label={`${accessibleName}を減らす`}
				>
					<Minus className="number-stepper__icon" />
				</button>
				<div className="number-stepper__value">
					<input
						ref={inputRef}
						id={`stepper-${name}`}
						type="text"
						inputMode="numeric"
						className="number-stepper__input"
						defaultValue={String(value)}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						onBlur={handleBlur}
						disabled={disabled}
						aria-label={accessibleName}
						aria-invalid={Boolean(errorMessage)}
					/>
					{unit && <span className="number-stepper__unit">{unit}</span>}
				</div>
				<button
					type="button"
					className="number-stepper__btn number-stepper__btn--plus"
					onClick={handleIncrement}
					disabled={disabled || isMaxReached}
					aria-label={`${accessibleName}を増やす`}
				>
					<Plus className="number-stepper__icon" />
				</button>
			</div>
			{!!errorMessage && <p className="number-stepper__error">{errorMessage}</p>}
		</div>
	);
}
