import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  children: ReactNode;
  color?: 'primary' | 'alert' | 'success' | 'warning' | 'info' | 'pear' | 'border';
  outline?: boolean;
};

export default function Button({
  children,
  type = 'button',
  color = 'primary',
  outline = false,
  disabled = false,
  className = '',
  ...buttonProps
}: Props) {
  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled}
      className={`button-base group ${color} ${disabled ? 'disabled' : ''} ${
        outline ? 'outline' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}
