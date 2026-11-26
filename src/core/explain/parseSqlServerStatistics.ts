/** Parsed SSMS/sqlcmd messages. Entries retain the order printed by SQL Server. */
export interface StatisticsIoEntry {
  table: string;
  scanCount?: number;
  logicalReads?: number;
  physicalReads?: number;
  readAheadReads?: number;
  lobLogicalReads?: number;
  pageServerReads?: number;
}

export interface StatisticsTimeEntry {
  phase: "compile" | "execution";
  cpuMs: number;
  elapsedMs: number;
}

export interface ParsedSqlServerStatistics {
  io: StatisticsIoEntry[];
  time: StatisticsTimeEntry[];
}

const metric = (line: string, label: string): number | undefined => {
  const matched = line.match(new RegExp(`(?:^|,)\\s*${label}\\s+(\\d+)(?=\\s*[,\\.]|$)`, "i"));
  return matched ? Number(matched[1]) : undefined;
};

export const parseSqlServerStatistics = (input: string): ParsedSqlServerStatistics => {
  if (input.length > 2_000_000) throw new Error("Statistics output exceeds the 2 MB limit.");
  const io: StatisticsIoEntry[] = [];
  const time: StatisticsTimeEntry[] = [];
  let phase: StatisticsTimeEntry["phase"] | undefined;
  for (const line of input.split(/\r?\n/)) {
    const table = line.match(/^\s*Table '((?:''|[^'])+)'\.\s*(.*)$/i);
    if (table) {
      const details = table[2]!;
      io.push({
        table: table[1]!.replace(/''/g, "'"),
        scanCount: metric(details, "scan count"),
        logicalReads: metric(details, "logical reads"),
        physicalReads: metric(details, "physical reads"),
        readAheadReads: metric(details, "read-ahead reads"),
        lobLogicalReads: metric(details, "lob logical reads"),
        pageServerReads: metric(details, "page server reads"),
      });
      continue;
    }
    if (/^\s*SQL Server parse and compile time:/i.test(line)) phase = "compile";
    else if (/^\s*SQL Server Execution Times:/i.test(line)) phase = "execution";
    const counters = line.match(/\bCPU time\s*=\s*(\d+)\s*ms\s*,\s*elapsed time\s*=\s*(\d+)\s*ms\b/i);
    if (phase && counters) {
      time.push({ phase, cpuMs: Number(counters[1]), elapsedMs: Number(counters[2]) });
      phase = undefined;
    }
  }
  return { io, time };
};
