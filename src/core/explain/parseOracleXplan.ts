/** A bounded reader for the text rows returned by DBMS_XPLAN.DISPLAY[_CURSOR]. */
const MAX_INPUT = 2_000_000;
const MAX_OPERATORS = 10_000;
const MAX_DEPTH = 128;

export interface OraclePlanNode {
  id: number;
  operation: string;
  objectName?: string;
  estimatedRows?: number;
  actualRows?: number;
  starts?: number;
  buffers?: number;
  reads?: number;
  cost?: number;
  actualTimeMs?: number;
  predicates: string[];
  children: OraclePlanNode[];
}

export interface ParsedOracleXplan {
  kind: "estimated" | "actual";
  sqlId?: string;
  childNumber?: number;
  planHashValue?: string;
  root: OraclePlanNode;
  nodes: OraclePlanNode[];
  notes: string[];
}

const columns = (line: string): string[] | undefined => {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|")
    ? trimmed.slice(1, -1).split("|") : undefined;
};

const number = (value?: string): number | undefined => {
  const match = value?.trim().replace(/,/g, "").match(/^(\d+(?:\.\d+)?)([KMG])?$/i);
  if (!match) return undefined;
  const multiplier = { K: 1e3, M: 1e6, G: 1e9 }[match[2]?.toUpperCase() as "K" | "M" | "G"] ?? 1;
  const parsed = Number(match[1]) * multiplier;
  return Number.isFinite(parsed) ? parsed : undefined;
};

const actualTime = (value?: string): number | undefined => {
  const match = value?.trim().match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
  if (!match || Number(match[2]) > 59 || Number(match[3]) > 59) return undefined;
  return ((Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])) * 1000)
    + Number(`0.${match[4] ?? "0"}`) * 1000;
};

const heading = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "");

export const parseOracleXplan = (input: string): ParsedOracleXplan => {
  if (input.length > MAX_INPUT) throw new Error("DBMS_XPLAN output exceeds the 2 MB limit.");
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const headerIndex = lines.findIndex((line) => {
    const cells = columns(line)?.map(heading);
    return cells?.includes("id") && cells.includes("operation");
  });
  if (headerIndex < 0) throw new Error("No DBMS_XPLAN table header found.");
  const headers = columns(lines[headerIndex])!.map(heading);
  if (lines.slice(headerIndex + 1).some((line) => {
    const cells = columns(line)?.map(heading);
    return cells?.includes("id") && cells.includes("operation");
  })) throw new Error("Multiple DBMS_XPLAN tables must be imported separately.");
  const field = (cells: string[], name: string): string | undefined => {
    const index = headers.indexOf(name);
    return index >= 0 ? cells[index] : undefined;
  };
  const nodes: OraclePlanNode[] = [];
  const byId = new Map<number, OraclePlanNode>();
  const stack: Array<{ indent: number; node: OraclePlanNode }> = [];
  let root: OraclePlanNode | undefined;

  for (const line of lines.slice(headerIndex + 1)) {
    const cells = columns(line);
    if (!cells) {
      if (nodes.length && /Predicate Information|^\s*Note\s*$/.test(line)) break;
      continue;
    }
    const idText = field(cells, "id")?.trim();
    if (!idText || !/^[*+]?\s*\d+$/.test(idText)) continue;
    if (cells.length !== headers.length) throw new Error("Malformed Oracle plan row.");
    const id = Number(idText.replace(/\D/g, ""));
    const operationCell = field(cells, "operation") ?? "";
    const operation = operationCell.trim();
    if (!operation || byId.has(id)) throw new Error("Invalid or repeated Oracle plan operation ID.");
    if (nodes.length >= MAX_OPERATORS) throw new Error("Oracle plan exceeds the operator limit.");
    const indent = operationCell.match(/^\s*/)?.[0].length ?? 0;
    const costText = field(cells, "cost(%cpu)") ?? field(cells, "cost");
    const node: OraclePlanNode = {
      id, operation,
      objectName: field(cells, "name")?.trim() || undefined,
      estimatedRows: number(field(cells, "e-rows") ?? field(cells, "rows")),
      actualRows: number(field(cells, "a-rows")),
      starts: number(field(cells, "starts") ?? field(cells, "start")),
      buffers: number(field(cells, "buffers") ?? field(cells, "buff")),
      reads: number(field(cells, "reads")),
      cost: number(costText?.trim().match(/^\d+(?:\.\d+)?/)?.[0]),
      actualTimeMs: actualTime(field(cells, "a-time")),
      predicates: [], children: [],
    };
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    if (!root) root = node;
    else (stack[stack.length - 1]?.node ?? root).children.push(node);
    if (stack.length >= MAX_DEPTH) throw new Error("Oracle plan exceeds the depth limit.");
    stack.push({ indent, node });
    nodes.push(node);
    byId.set(id, node);
  }
  if (!root) throw new Error("No Oracle plan operations found.");

  const notes: string[] = [];
  let section: "none" | "predicates" | "notes" = "none";
  let lastPredicate: OraclePlanNode | undefined;
  for (const line of lines.slice(headerIndex + 1)) {
    if (/^Predicate Information\s*\(identified by operation id\):/i.test(line.trim())) {
      section = "predicates"; lastPredicate = undefined; continue;
    }
    if (/^Note\s*$/i.test(line.trim())) { section = "notes"; continue; }
    if (/^[A-Za-z][\w ]+\s*(?:\([^)]*\))?:?\s*$/.test(line.trim()) && section !== "none") {
      section = "none"; continue;
    }
    if (section === "predicates") {
      const match = line.match(/^\s*(\d+)\s+-\s+(.+)$/);
      if (match) {
        lastPredicate = byId.get(Number(match[1]));
        if (lastPredicate) lastPredicate.predicates.push(match[2].trim());
      } else if (lastPredicate && /^\s{5,}\S/.test(line) && !/^\s*-+\s*$/.test(line)) {
        const index = lastPredicate.predicates.length - 1;
        lastPredicate.predicates[index] += ` ${line.trim()}`;
      }
    } else if (section === "notes") {
      const match = line.match(/^\s*-\s+(.+)$/);
      if (match) notes.push(match[1].trim());
    }
  }

  return {
    kind: nodes.some((node) => node.actualRows !== undefined || node.starts !== undefined ||
      node.actualTimeMs !== undefined || node.buffers !== undefined || node.reads !== undefined) ? "actual" : "estimated",
    sqlId: input.match(/\bSQL_ID\s+([a-z0-9]+)\s*,/i)?.[1],
    childNumber: number(input.match(/\bchild number\s+(\d+)/i)?.[1]),
    planHashValue: input.match(/\bPlan hash value:\s*(\d+)/i)?.[1],
    root, nodes, notes,
  };
};
