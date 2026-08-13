import { appendFile, glob, readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { analyzeQuery } from "../core/analyzer/analyzeQuery";
import {
  disabledRules,
  parseAnalyzerConfiguration,
  parseRuleList,
} from "../core/analyzer/configuration";
import type { AnalyzerSeverity, SqlDialect } from "../core/analyzer/types";
import { createTranslator } from "../i18n/i18n";
import { createCliReport, type CliAnalysis } from "../cli/report";
import { failedPolicy } from "../cli/run";
import type { FailureSeverity } from "../cli/types";
import { annotation, outputLine } from "./githubCommands";

const dialects: SqlDialect[] = [
  "postgresql",
  "mysql",
  "oracle",
  "sqlite",
  "sqlserver",
  "generic",
];
const severities: FailureSeverity[] = ["critical", "warning", "info"];
const t = createTranslator("en");

const input = (name: string, fallback: string): string =>
  process.env[`INPUT_${name.toUpperCase()}`]?.trim() || fallback;

const emit = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const workspacePath = (workspace: string, path: string): string => {
  const absolute = resolve(workspace, path);
  const relativePath = relative(workspace, absolute);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(`Path must stay inside the GitHub workspace: ${path}.`);
  }
  return absolute;
};

const lineForFragment = (sql: string, fragment: string | undefined): number | undefined => {
  if (!fragment) return undefined;
  const index = sql.toLowerCase().indexOf(fragment.trim().toLowerCase());
  if (index < 0) return undefined;
  return sql.slice(0, index).split(/\r?\n/).length;
};

const severityLevel: Record<Exclude<AnalyzerSeverity, "success">, "error" | "warning" | "notice"> = {
  critical: "error",
  warning: "warning",
  info: "notice",
};

const run = async (): Promise<void> => {
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const patterns = input("paths", "**/*.sql")
    .split(/\r?\n/)
    .map((pattern) => pattern.trim())
    .filter(Boolean);
  const dialect = input("dialect", "postgresql") as SqlDialect;
  if (!dialects.includes(dialect)) throw new Error(`Unsupported dialect: ${dialect}.`);

  const failOnInput = input("fail-on", "critical");
  const failOn = failOnInput === "none" ? undefined : (failOnInput as FailureSeverity);
  if (failOn !== undefined && !severities.includes(failOn)) {
    throw new Error(`Unsupported fail-on severity: ${failOnInput}.`);
  }
  const minScore = Number(input("min-score", "0"));
  if (!Number.isInteger(minScore) || minScore < 0 || minScore > 100) {
    throw new Error("min-score must be an integer from 0 to 100.");
  }
  const configPath = input("config", "");
  const configuredIgnores = configPath
    ? disabledRules(parseAnalyzerConfiguration(
      await readFile(workspacePath(workspace, configPath), "utf8"),
      configPath,
    ))
    : [];
  const inputIgnores = parseRuleList(input("ignore", ""), "ignore input");
  const ignoreRules = [...new Set([...configuredIgnores, ...inputIgnores])];

  const matched = new Set<string>();
  for (const pattern of patterns) {
    for await (const file of glob(pattern, {
      cwd: workspace,
      exclude: ["**/node_modules/**", "**/.git/**"],
    })) {
      matched.add(file);
    }
  }
  const files = [...matched].sort();
  if (files.length === 0) throw new Error("No SQL files matched the configured paths.");

  const analyses: CliAnalysis[] = [];
  for (const file of files) {
    const absolute = workspacePath(workspace, file);
    const sql = await readFile(absolute, "utf8");
    if (sql.trim().length === 0) {
      emit(annotation({
        file,
        level: "warning",
        title: "SQL Atlas: empty file",
        message: "The file was skipped because it contains no SQL.",
      }));
      continue;
    }
    const result = analyzeQuery(sql, dialect, { ignoreRules });
    analyses.push({ input: { source: file, sql }, result });
    for (const finding of result.findings) {
      emit(annotation({
        file,
        level: severityLevel[finding.severity],
        line: lineForFragment(sql, finding.detectedFragment),
        title: `SQL Atlas: ${t(finding.titleKey)}`,
        message: t(finding.suggestionKey),
      }));
    }
  }
  if (analyses.length === 0) throw new Error("All matched SQL files were empty.");

  const findings = analyses.reduce((sum, item) => sum + item.result.findings.length, 0);
  const lowestScore = Math.min(...analyses.map((item) => item.result.score));
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    await appendFile(
      outputFile,
      outputLine("files", analyses.length) +
        outputLine("findings", findings) +
        outputLine("lowest-score", lowestScore),
    );
  }
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    await appendFile(summaryFile, createCliReport("markdown", analyses));
  }

  emit(`SQL Atlas analyzed ${analyses.length} file(s), found ${findings} issue(s), lowest score ${lowestScore}/100.`);
  if (failedPolicy({ failOn, minScore: minScore === 0 ? undefined : minScore }, analyses)) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  emit(`::error title=SQL Atlas failed::${message.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A")}`);
  process.exitCode = 2;
});
