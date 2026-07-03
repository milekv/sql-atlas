import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { AnalyzerSeverity } from "../../core/analyzer/types";

type BadgeTone = AnalyzerSeverity | "neutral" | "cyan" | "violet";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const tones: Record<BadgeTone, string> = {
  critical: "border-atlas-red/60 bg-atlas-red/15 text-red-200",
  warning: "border-atlas-amber/60 bg-atlas-amber/15 text-amber-100",
  info: "border-atlas-cyan/60 bg-atlas-cyan/15 text-cyan-100",
  success: "border-atlas-green/60 bg-atlas-green/15 text-green-100",
  neutral: "border-atlas-border bg-atlas-panelStrong text-atlas-muted",
  cyan: "border-atlas-cyan/60 bg-atlas-cyan/15 text-cyan-100",
  violet: "border-atlas-violet/60 bg-atlas-violet/15 text-violet-100",
};

export const Badge = ({ children, tone = "neutral", className }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
      tones[tone],
      className,
    )}
  >
    {children}
  </span>
);
