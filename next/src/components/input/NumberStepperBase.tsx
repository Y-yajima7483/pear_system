'use client';

import { useState, useEffect } from "react";
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
}: Props<StepperValues>) {
	const [inputValue, setInputValue] = useState(String(value));

	useEffect(() => {
		setInputValue(String(value));
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
		const v = e.target.value;
		if (v === "" || /^\d+$/.test(v)) {
			setInputValue(v);
		}
	};

	const handleBlur = () => {
		if (inputValue === "" || isNaN(Number(inputValue))) {
			setInputValue(String(value));
			return;
		}
		let num = Number(inputValue);
		if (min !== undefined) num = Math.max(min, num);
		if (max !== undefined) num = Math.min(max, num);
		setInputValue(String(num));
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
					aria-label="減らす"
				>
					<Minus className="number-stepper__icon" />
				</button>
				<div className="number-stepper__value">
					<input
						id={`stepper-${name}`}
						type="text"
						inputMode="numeric"
						className="number-stepper__input"
						value={inputValue}
						onChange={handleInputChange}
						onBlur={handleBlur}
						disabled={disabled}
					/>
					{unit && <span className="number-stepper__unit">{unit}</span>}
				</div>
				<button
					type="button"
					className="number-stepper__btn number-stepper__btn--plus"
					onClick={handleIncrement}
					disabled={disabled || isMaxReached}
					aria-label="増やす"
				>
					<Plus className="number-stepper__icon" />
				</button>
			</div>
			{!!errorMessage && <p className="number-stepper__error">{errorMessage}</p>}
		</div>
	);
}
