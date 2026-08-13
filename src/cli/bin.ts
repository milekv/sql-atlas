import { readFile, writeFile } from "node:fs/promises";
import { cwd } from "node:process";
import { runCli } from "./run";

const readStdin = async (): Promise<string> => {
  if (process.stdin.isTTY) {
    throw new Error("Provide a SQL file or pipe SQL through standard input.");
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
};

const code = await runCli(process.argv.slice(2), {
  cwd: cwd(),
  readFile: (path) => readFile(path, "utf8"),
  readStdin,
  writeFile: (path, content) => writeFile(path, content, "utf8"),
  writeStdout: (content) => process.stdout.write(content),
  writeStderr: (content) => process.stderr.write(content),
});

process.exitCode = code;
