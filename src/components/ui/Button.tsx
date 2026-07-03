import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-atlas-cyan/70 bg-atlas-cyan/20 text-atlas-text hover:bg-atlas-cyan/30",
  secondary:
    "border-atlas-border bg-atlas-panelStrong text-atlas-text hover:border-atlas-cyan/60",
  ghost:
    "border-transparent bg-transparent text-atlas-muted hover:bg-atlas-panelStrong hover:text-atlas-text",
  danger:
    "border-atlas-red/70 bg-atlas-red/15 text-atlas-text hover:bg-atlas-red/25",
};

export const Button = ({
  className,
  variant = "secondary",
  icon,
  children,
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
      variants[variant],
      className,
    )}
    {...props}
  >
    {icon}
    {children}
  </button>
);
