import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { parseCliArgs } from "../cli/arguments";
import { runCli } from "../cli/run";
import type { CliIo } from "../cli/types";

const createIo = (files: Record<string, string> = {}, stdin = "") => {
  let stdout = "";
  let stderr = "";
  const written = new Map<string, string>();
  const io: CliIo = {
    cwd: resolve("/project"),
    readFile: async (path) => {
      const value = files[path];
      if (value === undefined) throw new Error(`Cannot read ${path}`);
      return value;
    },
    readStdin: async () => stdin,
    writeFile: async (path, content) => {
      written.set(path, content);
    },
    writeStdout: (content) => {
      stdout += content;
    },
    writeStderr: (content) => {
      stderr += content;
    },
  };
  return { io, output: () => stdout, error: () => stderr, written };
};

describe("SQL Atlas CLI", () => {
  it("prints help and version without reading input", async () => {
    const help = createIo();
    expect(await runCli(["--help"], help.io)).toBe(0);
    expect(help.output()).toContain("sql-atlas analyze [files...]");

    const version = createIo();
    expect(await runCli(["--version"], version.io)).toBe(0);
    expect(version.output()).toBe("0.4.0\n");
  });

  it("parses useful analysis options", () => {
    expect(
      parseCliArgs([
        "analyze",
        "query.sql",
        "--dialect",
        "sqlite",
        "--format",
        "json",
        "--fail-on",
        "warning",
        "--min-score",
        "80",
      ]),
    ).toMatchObject({
      dialect: "sqlite",
      failOn: "warning",
      files: ["query.sql"],
      format: "json",
      minScore: 80,
    });
  });

  it("analyzes standard input as text", async () => {
    const context = createIo({}, "SELECT * FROM customers;");
    expect(await runCli(["analyze"], context.io)).toBe(0);
    expect(context.output()).toContain("stdin - score");
    expect(context.output()).toContain("[warning]");
    expect(context.error()).toBe("");
  });

  it("returns stable JSON for multiple files", async () => {
    const context = createIo({
      [resolve("/project/a.sql")]: "SELECT * FROM customers;",
      [resolve("/project/b.sql")]: "DELETE FROM sessions;",
    });
    expect(
      await runCli(["analyze", "a.sql", "b.sql", "--format", "json"], context.io),
    ).toBe(0);
    const report = JSON.parse(context.output());
    expect(report.version).toBe(1);
    expect(report.summary.inputs).toBe(2);
    expect(report.results.map((result: { source: string }) => result.source)).toEqual([
      "a.sql",
      "b.sql",
    ]);
  });

  it("uses exit code 1 when a severity policy fails", async () => {
    const context = createIo({
      [resolve("/project/danger.sql")]: "DELETE FROM sessions;",
    });
    expect(
      await runCli(
        ["analyze", "danger.sql", "--fail-on", "critical"],
        context.io,
      ),
    ).toBe(1);
    expect(context.output()).toContain("[critical]");
  });

  it("uses exit code 1 when the minimum score fails", async () => {
    const context = createIo({}, "SELECT * FROM customers;");
    expect(await runCli(["analyze", "--min-score", "100"], context.io)).toBe(1);
  });

  it("writes Markdown to the requested output file", async () => {
    const context = createIo({
      [resolve("/project/query.sql")]: "SELECT id FROM users WHERE id = 1;",
    });
    expect(
      await runCli(
        ["analyze", "query.sql", "--format", "markdown", "--output", "report.md"],
        context.io,
      ),
    ).toBe(0);
    expect(context.output()).toBe("");
    expect(context.written.get(resolve("/project/report.md"))).toContain(
      "# SQL Atlas Optimization Report",
    );
  });

  it("reports usage and input errors with exit code 2", async () => {
    const context = createIo({}, "");
    expect(await runCli(["analyze", "--dialect", "unknown"], context.io)).toBe(2);
    expect(context.error()).toContain("Unsupported dialect");

    const empty = createIo({}, "   ");
    expect(await runCli(["analyze"], empty.io)).toBe(2);
    expect(empty.error()).toContain("SQL input is empty");
  });
});
