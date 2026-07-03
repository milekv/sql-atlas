import { highlightSql } from "../../lib/highlightSql";
import { cn } from "../../lib/cn";

interface CodeBlockProps {
  code: string;
  className?: string;
  language?: "sql" | "markdown" | "text";
}

export const CodeBlock = ({
  code,
  className,
  language = "sql",
}: CodeBlockProps) => (
  <pre
    className={cn(
      "max-h-[440px] overflow-auto rounded-md border border-atlas-border bg-[#070a10] p-4 text-sm leading-6 text-atlas-text",
      className,
    )}
  >
    {language === "sql" ? (
      <code
        className="code-highlight"
        dangerouslySetInnerHTML={{ __html: highlightSql(code) }}
      />
    ) : (
      <code>{code}</code>
    )}
  </pre>
);
