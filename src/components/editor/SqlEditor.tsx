import { lazy, Suspense } from "react";

const MonacoEditor = lazy(async () => {
  const module = await import("@monaco-editor/react");
  return { default: module.default };
});

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const SqlEditor = ({ value, onChange }: SqlEditorProps) => (
  <div className="overflow-hidden rounded-lg border border-atlas-border bg-[#070a10]">
    <Suspense fallback={<SqlEditorSkeleton />}>
      <MonacoEditor
        height="420px"
        defaultLanguage="sql"
        theme="vs-dark"
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbersMinChars: 3,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 16, bottom: 16 },
          automaticLayout: true,
        }}
      />
    </Suspense>
  </div>
);

const SqlEditorSkeleton = () => (
  <div className="h-[420px] animate-pulse bg-[#070a10] p-4">
    <div className="mb-4 h-4 w-40 rounded bg-atlas-border" />
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="h-3 rounded bg-atlas-border"
          style={{ width: `${92 - index * 5}%` }}
        />
      ))}
    </div>
  </div>
);
