import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => (
  <section
    className={cn(
      "rounded-lg border border-atlas-border bg-atlas-panel p-5 shadow-atlas",
      className,
    )}
  >
    {children}
  </section>
);
