'use client';

import { Controller, type FieldValues, type Control, type FieldPath } from "react-hook-form";
import NumberStepperBase from "./NumberStepperBase";

interface Props<StepperValues extends FieldValues> {
	name: FieldPath<StepperValues>;
	label?: string;
	control: Control<StepperValues>;
	errorMessage?: string;
	unit?: string;
	min?: number;
	max?: number;
	step?: number;
	required?: boolean;
	disabled?: boolean;
}

export default function NumberStepper<StepperValues extends FieldValues>({
	name,
	label,
	control,
	errorMessage,
	unit,
	min,
	max,
	step,
	required,
	disabled,
}: Props<StepperValues>) {
	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => {
				return (
					<NumberStepperBase
						name={name}
						label={label}
						value={field.value}
						onChange={field.onChange}
						errorMessage={errorMessage}
						unit={unit}
						min={min}
						max={max}
						step={step}
						required={required}
						disabled={disabled}
					/>
				);
			}}
		/>
	);
}
