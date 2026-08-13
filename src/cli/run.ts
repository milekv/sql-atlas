import { resolve } from "node:path";
import packageMetadata from "../../package.json";
import { analyzeQuery } from "../core/analyzer/analyzeQuery";
import type { AnalyzerSeverity } from "../core/analyzer/types";
import { parseCliArgs } from "./arguments";
import { createCliReport, type CliAnalysis } from "./report";
import type { AnalyzeOptions, CliIo, SqlInput } from "./types";

export const CLI_VERSION = packageMetadata.version;

export const helpText = `SQL Atlas ${CLI_VERSION}

Analyze SQL locally from a file or standard input.

Usage:
  sql-atlas analyze [files...] [options]
  sql-atlas analyze - [options]

Options:
  -d, --dialect <name>   postgresql, mysql, oracle, sqlite, sqlserver, generic
  -f, --format <format>  text, json, markdown (default: text)
  -o, --output <file>    Write the report to a file
      --fail-on <level>  Exit 1 for critical, warning or info findings
      --min-score <n>    Exit 1 when any score is below n (0-100)
  -h, --help             Show help
  -v, --version          Show version

When no file is given, SQL Atlas reads from standard input.
Exit codes: 0 success, 1 policy threshold failed, 2 input or usage error.
`;

const readInputs = async (options: AnalyzeOptions, io: CliIo): Promise<SqlInput[]> => {
  const sources = options.files.length === 0 ? ["-"] : options.files;
  const stdin = sources.includes("-") ? await io.readStdin() : undefined;
  const inputs = await Promise.all(
    sources.map(async (source) => ({
      source: source === "-" ? "stdin" : source,
      sql: source === "-" ? (stdin ?? "") : await io.readFile(resolve(io.cwd, source)),
    })),
  );

  for (const input of inputs) {
    if (input.sql.trim().length === 0) {
      throw new Error(`${input.source}: SQL input is empty.`);
    }
  }
  return inputs;
};

const severityRank: Record<Exclude<AnalyzerSeverity, "success">, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

export const failedPolicy = (
  options: Pick<AnalyzeOptions, "failOn" | "minScore">,
  analyses: CliAnalysis[],
): boolean => {
  if (
    options.minScore !== undefined &&
    analyses.some(({ result }) => result.score < options.minScore!)
  ) {
    return true;
  }
  if (options.failOn === undefined) return false;
  const threshold = severityRank[options.failOn];
  return analyses.some(({ result }) =>
    result.findings.some((finding) => severityRank[finding.severity] >= threshold),
  );
};

export const runCli = async (args: string[], io: CliIo): Promise<number> => {
  try {
    const parsed = parseCliArgs(args);
    if (parsed.command === "help") {
      io.writeStdout(helpText);
      return 0;
    }
    if (parsed.command === "version") {
      io.writeStdout(`${CLI_VERSION}\n`);
      return 0;
    }

    const inputs = await readInputs(parsed, io);
    const analyses = inputs.map((input) => ({
      input,
      result: analyzeQuery(input.sql, parsed.dialect),
    }));
    const report = createCliReport(parsed.format, analyses);
    if (parsed.output === undefined) io.writeStdout(report);
    else await io.writeFile(resolve(io.cwd, parsed.output), report);
    return failedPolicy(parsed, analyses) ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.writeStderr(`sql-atlas: ${message}\nRun 'sql-atlas --help' for usage.\n`);
    return 2;
  }
};
