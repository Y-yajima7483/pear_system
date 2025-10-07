'use client'

import { Controller, type FieldValues, type Control, type UseFormTrigger, type FieldPath, type PathValue, type Path } from "react-hook-form";
import TextFieldBase from "./TextFieldBase";

interface Props<TextFieldValues extends FieldValues> {
	type?: "text" | "password" | "email" | "number";
	name: FieldPath<TextFieldValues>;
	inputLabel: string;
	control: Control<TextFieldValues>;
	trigger: UseFormTrigger<TextFieldValues>;
	errorMessage?: string;
	suffix?: string;
	defaultValue?: PathValue<TextFieldValues, Path<TextFieldValues>>;
}

export default function TextField<TextFieldValues extends FieldValues>({
	type = "text",
	name,
	inputLabel,
	control,
	errorMessage,
	suffix,
	defaultValue,
	trigger,
}: Props<TextFieldValues>) {
	return (
		<Controller
			name={name}
			control={control}
			defaultValue={defaultValue}
			render={({ field }) => {
				return (
					<TextFieldBase
						type={type}
						name={name}
						value={field.value}
						inputLabel={inputLabel}
						errorMessage={errorMessage}
						onChange={field.onChange}
						trigger={trigger}
						suffix={suffix}
					/>
				);
			}}
		/>
	);
}