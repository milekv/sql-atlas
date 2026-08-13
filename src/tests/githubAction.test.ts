import { describe, expect, it } from "vitest";
import { annotation, outputLine } from "../action/githubCommands";

describe("GitHub Action commands", () => {
  it("creates file and line annotations", () => {
    expect(
      annotation({
        file: "migrations/001.sql",
        level: "error",
        line: 7,
        title: "SQL Atlas: DELETE without WHERE",
        message: "Add a WHERE clause.",
      }),
    ).toBe(
      "::error file=migrations/001.sql,line=7,title=SQL Atlas%3A DELETE without WHERE::Add a WHERE clause.",
    );
  });

  it("escapes untrusted workflow command data", () => {
    expect(
      annotation({
        file: "a,b.sql",
        level: "warning",
        title: "line:break",
        message: "first\nsecond%",
      }),
    ).toContain("file=a%2Cb.sql,title=line%3Abreak::first%0Asecond%25");
  });

  it("creates GitHub output lines", () => {
    expect(outputLine("lowest-score", 72)).toBe("lowest-score=72\n");
  });
});
