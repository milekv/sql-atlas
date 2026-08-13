import type { SqlDialect } from "../core/analyzer/types";

export const cliFormats = ["text", "json", "markdown"] as const;
export type CliFormat = (typeof cliFormats)[number];

export const failureSeverities = ["critical", "warning", "info"] as const;
export type FailureSeverity = (typeof failureSeverities)[number];

export interface AnalyzeOptions {
  command: "analyze";
  dialect: SqlDialect;
  failOn?: FailureSeverity;
  files: string[];
  format: CliFormat;
  minScore?: number;
  output?: string;
}

export type ParsedCommand =
  | AnalyzeOptions
  | { command: "help" }
  | { command: "version" };

export interface CliIo {
  cwd: string;
  readFile: (path: string) => Promise<string>;
  readStdin: () => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  writeStdout: (content: string) => void;
  writeStderr: (content: string) => void;
}

export interface SqlInput {
  source: string;
  sql: string;
}
