import * as vscode from "vscode";
import { analyzeQuery } from "../core/analyzer/analyzeQuery";
import { parseRuleList } from "../core/analyzer/configuration";
import type {
  AnalyzerFinding,
  AnalyzerSeverity,
  RuleId,
  SqlDialect,
} from "../core/analyzer/types";
import { createTranslator } from "../i18n/i18n";
import { diagnosticSummary, findFragmentOffset, shouldShowSeverity } from "./diagnosticUtils";

const collection = vscode.languages.createDiagnosticCollection("sql-atlas");
const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
status.name = "SQL Atlas";
status.command = "sqlAtlas.analyzeCurrentFile";
status.tooltip = "Run SQL Atlas and show diagnostics";
const t = createTranslator("en");
const diagnosticSeverity = (
  severity: Exclude<AnalyzerSeverity, "success">,
): vscode.DiagnosticSeverity => {
  if (severity === "critical") return vscode.DiagnosticSeverity.Error;
  if (severity === "warning") return vscode.DiagnosticSeverity.Warning;
  return vscode.DiagnosticSeverity.Information;
};

const findingRange = (
  document: vscode.TextDocument,
  finding: AnalyzerFinding,
): vscode.Range => {
  const text = document.getText();
  const fragment = finding.detectedFragment;
  const offset = findFragmentOffset(text, fragment);
  const matched = fragment
    ? text.toLowerCase().includes(fragment.toLowerCase())
    : false;
  const start = document.positionAt(offset);
  const end = matched && fragment
    ? document.positionAt(offset + fragment.length)
    : document.lineAt(start.line).range.end;
  return new vscode.Range(start, end);
};

const configurationFor = (document: vscode.TextDocument) => {
  const configuration = vscode.workspace.getConfiguration("sqlAtlas", document.uri);
  const dialect = configuration.get<SqlDialect>("dialect", "postgresql");
  const minimumSeverity = configuration.get<"critical" | "warning" | "info">(
    "minimumSeverity",
    "info",
  );
  const ignoreRules = parseRuleList(
    configuration.get<string[]>("ignoreRules", []).join(","),
    "sqlAtlas.ignoreRules",
  );
  return { dialect, minimumSeverity, ignoreRules };
};

const analyzeDocument = (document: vscode.TextDocument): void => {
  if (document.languageId !== "sql") return;
  try {
    const { dialect, minimumSeverity, ignoreRules } = configurationFor(document);
    const result = analyzeQuery(document.getText(), dialect, { ignoreRules });
    const diagnostics = result.findings
      .filter((finding) => shouldShowSeverity(finding.severity, minimumSeverity))
      .map((finding) => {
        const diagnostic = new vscode.Diagnostic(
          findingRange(document, finding),
          `${t(finding.titleKey)} ${t(finding.suggestionKey)}`,
          diagnosticSeverity(finding.severity),
        );
        diagnostic.source = "SQL Atlas";
        diagnostic.code = finding.id;
        return diagnostic;
      });
    collection.set(
      document.uri,
      diagnostics,
    );
    if (vscode.window.activeTextEditor?.document.uri.toString() === document.uri.toString()) {
      const errors = diagnostics.filter((item) => item.severity === vscode.DiagnosticSeverity.Error).length;
      const warnings = diagnostics.filter((item) => item.severity === vscode.DiagnosticSeverity.Warning).length;
      const info = diagnostics.length - errors - warnings;
      status.text = diagnostics.length === 0 ? "$(pass-filled) SQL Atlas: clean" : `$(warning) ${diagnosticSummary(errors, warnings, info)}`;
      status.backgroundColor = errors > 0 ? new vscode.ThemeColor("statusBarItem.errorBackground") : undefined;
      status.show();
    }
  } catch (error) {
    collection.delete(document.uri);
    console.error("SQL Atlas analysis failed", error);
  }
};

class IgnoreRuleCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    return context.diagnostics
      .filter((diagnostic) => diagnostic.source === "SQL Atlas")
      .flatMap((diagnostic) => {
        const rule = typeof diagnostic.code === "string"
          ? diagnostic.code as RuleId
          : undefined;
        if (!rule) return [];
        const action = new vscode.CodeAction(
          `SQL Atlas: ignore ${rule} in this file`,
          vscode.CodeActionKind.QuickFix,
        );
        action.diagnostics = [diagnostic];
        action.isPreferred = false;
        action.edit = new vscode.WorkspaceEdit();
        action.edit.insert(document.uri, new vscode.Position(0, 0),
          `-- sql-atlas-ignore ${rule}\n`);
        return [action];
      });
  }
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(collection, status);
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(analyzeDocument),
    vscode.workspace.onDidChangeTextDocument(({ document }) => analyzeDocument(document)),
    vscode.workspace.onDidCloseTextDocument((document) => collection.delete(document.uri)),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor?.document.languageId === "sql") analyzeDocument(editor.document);
      else status.hide();
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("sqlAtlas")) return;
      vscode.workspace.textDocuments.forEach(analyzeDocument);
    }),
    vscode.languages.registerCodeActionsProvider(
      { language: "sql", scheme: "file" },
      new IgnoreRuleCodeActionProvider(),
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] },
    ),
    vscode.commands.registerCommand("sqlAtlas.analyzeCurrentFile", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "sql") {
        void vscode.window.showInformationMessage("Open a .sql file to run SQL Atlas.");
        return;
      }
      analyzeDocument(editor.document);
      await vscode.commands.executeCommand("workbench.actions.view.problems");
    }),
    vscode.commands.registerCommand("sqlAtlas.openSample", async () => {
      const sample = await vscode.workspace.openTextDocument({
        language: "sql",
        content: "SELECT *\nFROM users\nWHERE LOWER(email) LIKE '%@example.com'\nORDER BY RANDOM();\n",
      });
      await vscode.window.showTextDocument(sample);
      analyzeDocument(sample);
    }),
  );
  vscode.workspace.textDocuments.forEach(analyzeDocument);
}

export function deactivate(): void {
  collection.dispose();
}
