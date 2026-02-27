'use client';

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
				<span id={`stepper-${name}`} className="number-stepper__value">
					{value}
					{unit && <span className="number-stepper__unit">{unit}</span>}
				</span>
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
