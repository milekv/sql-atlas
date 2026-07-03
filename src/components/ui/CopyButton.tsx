import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../app/AppProvider";
import { cn } from "../../lib/cn";
import { Button } from "./Button";

interface CopyButtonProps {
  value: string;
  compact?: boolean;
}

export const CopyButton = ({ value, compact = false }: CopyButtonProps) => {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(compact ? "h-8 px-2" : undefined, copied && "atlas-copy-feedback")}
      icon={copied ? <Check size={16} /> : <Copy size={16} />}
      onClick={copy}
    >
      {copied ? t("actions.copied") : t("actions.copy")}
    </Button>
  );
};
