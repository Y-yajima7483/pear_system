'use client';

import { Controller, type FieldValues, type Control, type FieldPath } from "react-hook-form";
import SwitchButtonBase from "./SwitchButtonBase";

interface Props<SwitchValues extends FieldValues> {
	name: FieldPath<SwitchValues>;
	label?: string;
	control: Control<SwitchValues>;
	errorMessage?: string;
	disabled?: boolean;
}

export default function SwitchButton<SwitchValues extends FieldValues>({
	name,
	label,
	control,
	errorMessage,
	disabled,
}: Props<SwitchValues>) {
	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => {
				return (
					<SwitchButtonBase
						name={name}
						label={label}
						checked={field.value}
						onChange={field.onChange}
						errorMessage={errorMessage}
						disabled={disabled}
					/>
				);
			}}
		/>
	);
}
