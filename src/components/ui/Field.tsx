import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const textFieldClass =
  "h-10 rounded-md border border-atlas-border bg-atlas-panelStrong px-3 text-sm text-atlas-text outline-none transition placeholder:text-atlas-muted focus:border-atlas-cyan/70";

export const TextInput = ({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(textFieldClass, className)} {...props} />
);

export const SelectInput = ({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(textFieldClass, className)} {...props} />
);
