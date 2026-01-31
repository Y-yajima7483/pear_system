'use client';

import type { FieldValues, FieldPath } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface Props<SwitchValues extends FieldValues> {
	name: FieldPath<SwitchValues>;
	label?: string;
	errorMessage?: string;
	onChange?: (checked: boolean) => void;
	checked?: boolean;
	disabled?: boolean;
}

export default function SwitchButtonBase<SwitchValues extends FieldValues>({
	name,
	label,
	errorMessage,
	onChange,
	checked,
	disabled,
}: Props<SwitchValues>) {
	return (
		<div className={cn("switch-field", errorMessage && "error")}>
			<div className="switch-field__container">
				<Switch
					id={`switch-${name}`}
					checked={checked}
					onCheckedChange={onChange}
					disabled={disabled}
					className={cn(
						errorMessage && "data-[state=checked]:bg-error data-[state=unchecked]:border-error"
					)}
				/>
				{label && (
					<label
						htmlFor={`switch-${name}`}
						className="switch-field__label"
					>
						{label}
					</label>
				)}
			</div>
			{!!errorMessage && <p className="switch-field__error">{errorMessage}</p>}
		</div>
	);
}
