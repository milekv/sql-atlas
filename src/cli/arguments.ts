import type { SqlDialect } from "../core/analyzer/types";
import {
  cliFormats,
  failureSeverities,
  type AnalyzeOptions,
  type ParsedCommand,
} from "./types";

const dialects: SqlDialect[] = [
  "postgresql",
  "mysql",
  "oracle",
  "sqlite",
  "sqlserver",
  "generic",
];

const takeValue = (args: string[], index: number, flag: string): string => {
  const value = args[index + 1];
  if (value === undefined || value.startsWith("-")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
};

export const parseCliArgs = (args: string[]): ParsedCommand => {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return { command: "help" };
  }
  if (args.includes("--version") || args.includes("-v")) {
    return { command: "version" };
  }
  if (args[0] !== "analyze") {
    throw new Error(`Unknown command: ${args[0]}.`);
  }

  const options: AnalyzeOptions = {
    command: "analyze",
    dialect: "postgresql",
    files: [],
    format: "text",
  };

  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index]!;
    if (argument === "--dialect" || argument === "-d") {
      const value = takeValue(args, index, argument) as SqlDialect;
      if (!dialects.includes(value)) throw new Error(`Unsupported dialect: ${value}.`);
      options.dialect = value;
      index += 1;
    } else if (argument === "--format" || argument === "-f") {
      const value = takeValue(args, index, argument) as AnalyzeOptions["format"];
      if (!cliFormats.includes(value)) throw new Error(`Unsupported format: ${value}.`);
      options.format = value;
      index += 1;
    } else if (argument === "--output" || argument === "-o") {
      options.output = takeValue(args, index, argument);
      index += 1;
    } else if (argument === "--fail-on") {
      const value = takeValue(args, index, argument) as AnalyzeOptions["failOn"];
      if (value === undefined || !failureSeverities.includes(value)) {
        throw new Error(`Unsupported severity: ${value}.`);
      }
      options.failOn = value;
      index += 1;
    } else if (argument === "--min-score") {
      const value = Number(takeValue(args, index, argument));
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        throw new Error("--min-score must be an integer from 0 to 100.");
      }
      options.minScore = value;
      index += 1;
    } else if (argument.startsWith("-") && argument !== "-") {
      throw new Error(`Unknown option: ${argument}.`);
    } else {
      options.files.push(argument);
    }
  }

  if (options.files.filter((file) => file === "-").length > 1) {
    throw new Error("Standard input can only be specified once.");
  }
  return options;
};
