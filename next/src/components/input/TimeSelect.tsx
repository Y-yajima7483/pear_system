import { Controller, type FieldValues, type Control, type UseFormTrigger, type FieldPath } from "react-hook-form";
import TimeSelectBase from "./TimeSelectBase";

interface Props<ESFieldValues extends FieldValues> {
  control: Control<ESFieldValues>;
  name: FieldPath<ESFieldValues>;
  inputLabel?: string;
  errorMessage?: string;
  trigger: UseFormTrigger<ESFieldValues>;
}

export default function TimeSelect<ESFieldValues extends FieldValues>({
  name,
  inputLabel,
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
          <TimeSelectBase
            name={name}
            inputLabel={inputLabel}
            errorMessage={errorMessage}
            value={field.value}
            onChange={field.onChange}
            trigger={trigger}
          />
        );
      }}
    />
  );
}