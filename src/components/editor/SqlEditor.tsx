import { lazy, Suspense, useEffect, useRef } from "react";
import type { OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import type { AnalyzerFinding } from "../../core/analyzer/types";
import type { TranslationKey } from "../../i18n/types";
import { toEditorMarkers } from "./editorDiagnostics";

const MonacoEditor = lazy(async () => {
  const [module, { default: loader }, monaco, { default: EditorWorker }] = await Promise.all([
    import("@monaco-editor/react"),
    import("@monaco-editor/loader"),
    import("monaco-editor/esm/vs/editor/editor.api.js"),
    import("monaco-editor/esm/vs/editor/editor.worker?worker"),
  ]);
  await import("monaco-editor/esm/vs/basic-languages/sql/sql.contribution.js");
  self.MonacoEnvironment = { getWorker: () => new EditorWorker() };
  loader.config({ monaco });
  return { default: module.default };
});

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  findings?: readonly AnalyzerFinding[];
  analyzedSql?: string;
  translate?: (key: TranslationKey) => string;
  navigation?: { start: number; end: number; nonce: number };
}

export const SqlEditor = ({ value, onChange, findings = [], analyzedSql, translate = (key) => key, navigation }: SqlEditorProps) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.onDidDispose(() => {
      editorRef.current = null;
      monacoRef.current = null;
    });
    syncMarkers(editor, monaco);
  };

  const syncMarkers = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    const model = editor.getModel();
    if (!model) return;
    const markers = toEditorMarkers(value, findings, translate, analyzedSql);
    monaco.editor.setModelMarkers(model, "sql-atlas", markers.map((marker) => ({
      ...marker,
      source: "SQL Atlas",
      severity: marker.severity === "critical" ? monaco.MarkerSeverity.Error
        : marker.severity === "warning" ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Info,
    })));
  };

  useEffect(() => {
    if (editorRef.current && monacoRef.current) syncMarkers(editorRef.current, monacoRef.current);
  }, [value, findings, analyzedSql, translate]);

  useEffect(() => {
    if (!navigation || !editorRef.current || value !== analyzedSql) return;
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;
    const start = model.getPositionAt(navigation.start);
    const end = model.getPositionAt(navigation.end);
    editor.setSelection({
      startLineNumber: start.lineNumber, startColumn: start.column,
      endLineNumber: end.lineNumber, endColumn: end.column,
    });
    editor.revealLineInCenter(start.lineNumber);
    editor.focus();
  }, [navigation, value, analyzedSql]);

  return (
  <div className="overflow-hidden rounded-lg border border-atlas-border bg-[#070a10]">
    <Suspense fallback={<SqlEditorSkeleton />}>
      <MonacoEditor
        height="420px"
        defaultLanguage="sql"
        theme="vs-dark"
        value={value}
        onMount={handleMount}
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
};

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
