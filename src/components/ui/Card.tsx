import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export const Card = ({ children, className, ...props }: CardProps) => (
  <section
    className={cn(
      "rounded-lg border border-atlas-border bg-atlas-panel p-5 shadow-atlas",
      className,
    )}
    {...props}
  >
    {children}
  </section>
);
