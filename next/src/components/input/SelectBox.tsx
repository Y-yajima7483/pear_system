import { Controller, type FieldValues, type Control, type UseFormTrigger, type FieldPath } from "react-hook-form";
import type { OptionType } from "@/types/index";
import SelectBoxBase from "./SelectBoxBase";

type ValueType = string | number;

interface Props<ESFieldValues extends FieldValues, T extends ValueType = string> {
	control: Control<ESFieldValues>;
	name: FieldPath<ESFieldValues>;
	inputLabel: string;
	option: Array<OptionType<T>>;
	errorMessage?: string;
	trigger: UseFormTrigger<ESFieldValues>;
}

export default function SelectBox<ESFieldValues extends FieldValues, T extends ValueType = string>({
	name,
	inputLabel,
	option,
	control,
	errorMessage,
	trigger,
}: Props<ESFieldValues, T>) {
	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => {
				return (
					<SelectBoxBase
						name={name}
						inputLabel={inputLabel}
						option={option}
						errorMessage={errorMessage}
						onChange={field.onChange}
						trigger={trigger}
						value={field.value}
					/>
				);
			}}
		/>
	);
}
