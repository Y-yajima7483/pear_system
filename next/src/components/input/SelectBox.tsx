import { Controller, type FieldValues, type Control, type UseFormTrigger, type FieldPath } from "react-hook-form";
import type { OptionType } from "@/types/index";
import SelectBoxBase from "./SelectBoxBase";

interface Props<ESFieldValues extends FieldValues> {
	control: Control<ESFieldValues>;
	name: FieldPath<ESFieldValues>;
	inputLabel: string;
	option: Array<OptionType>;
	errorMessage?: string;
	trigger: UseFormTrigger<ESFieldValues>;
}

export default function SelectBox<ESFieldValues extends FieldValues>({
	name,
	inputLabel,
	option,
	control,
	errorMessage,
	trigger,
}: Props<ESFieldValues>) {
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
					/>
				);
			}}
		/>
	);
}
