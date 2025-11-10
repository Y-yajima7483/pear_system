interface Props {
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
	children: React.ReactNode;
	type: "button" | "submit";
	color?: "primary" | "alert" | "success" | "warning" | "info" | "pear" | "border";
	outline?: boolean;
	disabled? : boolean;
	className?: string;
}

export default function Button({ onClick, children, type="button", color="primary", outline=false, disabled=false, className="" }: Props) {
  return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={`button-base group ${color} ${disabled ? "disabled" : ""} ${outline ? "outline" : ""} ${className}`}
			>
			{children}
		</button>
	);
}
