'use client'

import { Controller, type FieldValues, type Control, type UseFormTrigger, type FieldPath } from "react-hook-form";
import TextAreaBase from "./TextAreaBase";

interface Props<TextAreaValues extends FieldValues> {
	name: FieldPath<TextAreaValues>;
	inputLabel: string;
	control: Control<TextAreaValues>;
	trigger: UseFormTrigger<TextAreaValues>;
	errorMessage?: string;
	defaultValue?: string;
	rows?: number;
	cols?: number;
	maxLength?: number;
	placeholder?: string;
	resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

export default function TextArea<TextAreaValues extends FieldValues>({
	name,
	inputLabel,
	control,
	errorMessage,
	defaultValue,
	trigger,
	rows,
	cols,
	maxLength,
	placeholder,
	resize
}: Props<TextAreaValues>) {
	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => {
				return (
					<TextAreaBase
						name={name}
						value={field.value}
						inputLabel={inputLabel}
						errorMessage={errorMessage}
						defaultValue={defaultValue}
						onChange={field.onChange}
						trigger={trigger}
						rows={rows}
						cols={cols}
						maxLength={maxLength}
						placeholder={placeholder}
						resize={resize}
					/>
				);
			}}
		/>
	);
}