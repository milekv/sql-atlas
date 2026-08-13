import {
  splitSqlStatements,
  stripSqlComments,
  uniqueValues,
} from "../analyzer/analyzerUtils";
import type { SqlDialect } from "../analyzer/types";
import type {
  ColumnReference,
  IndexConfidence,
  IndexSuggestion,
  IndexSuggestionSource,
  LocalizedText,
  TableReference,
} from "./types";

const reservedWords = new Set([
  "on",
  "where",
  "join",
  "left",
  "right",
  "inner",
  "outer",
  "full",
  "cross",
  "group",
  "order",
  "limit",
  "offset",
  "using",
]);

const educationalWarning: LocalizedText = {
  en: "Verify with real data and EXPLAIN ANALYZE. Indexes can speed up SELECT queries, but may slow down INSERT, UPDATE, DELETE and consume storage.",
  pl: "Zweryfikuj na realnych danych przez EXPLAIN ANALYZE. Indeksy moga przyspieszac SELECT, ale spowalniac INSERT, UPDATE, DELETE i zajmowac miejsce.",
};

const sanitizeIdentifier = (value: string): string =>
  value
    .replace(/["`[\]]/g, "")
    .replace(/\W+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

const buildIndexName = (
  tableName: string,
  columns: string[],
  expression?: string,
): string =>
  `idx_${sanitizeIdentifier(tableName)}_${
    expression
      ? sanitizeIdentifier(expression)
      : columns.map(sanitizeIdentifier).join("_")
  }`;

const createSuggestion = ({
  tableName,
  columns,
  expression,
  source,
  confidence,
  relatedQueryFragment,
}: {
  tableName: string;
  columns: string[];
  expression?: string;
  source: IndexSuggestionSource;
  confidence: IndexConfidence;
  relatedQueryFragment: string;
}): IndexSuggestion => {
  const indexName = buildIndexName(tableName, columns, expression);
  const target = expression ?? columns.join(", ");

  return {
    id: `${tableName}:${source}:${target}`,
    tableName,
    columns,
    expression,
    source,
    sqlSnippet: `CREATE INDEX ${indexName}\nON ${tableName} (${target});`,
    reason: {
      en: `Candidate index for ${source.replace("-", " ")} access on ${tableName}.`,
      pl: `Kandydat na indeks dla ${source.replace("-", " ")} w tabeli ${tableName}.`,
    },
    confidence,
    relatedQueryFragment,
    educationalWarning,
  };
};

const extractTableReferences = (sql: string): TableReference[] => {
  const refs: TableReference[] = [];
  const pattern =
    /\b(?:from|join)\s+([a-zA-Z_][\w."]*)\s*(?:as\s+)?([a-zA-Z_][\w"]*)?/gi;

  for (const match of sql.matchAll(pattern)) {
    const tableName = sanitizeIdentifier(match[1]);
    const rawAlias = match[2] ? sanitizeIdentifier(match[2]) : tableName;
    const alias = reservedWords.has(rawAlias) ? tableName : rawAlias;
    refs.push({ name: tableName, alias });
  }

  return refs;
};

const getDefaultTable = (tables: TableReference[]): string =>
  tables[0]?.name ?? "table_name";

const resolveTableName = (
  aliasOrTable: string | undefined,
  tables: TableReference[],
): string => {
  if (!aliasOrTable) {
    return getDefaultTable(tables);
  }

  const normalized = sanitizeIdentifier(aliasOrTable);
  return (
    tables.find((table) => table.alias === normalized || table.name === normalized)
      ?.name ?? normalized
  );
};

const toColumnReference = (
  rawReference: string,
  fragment: string,
  tables: TableReference[],
): ColumnReference => {
  const cleaned = rawReference.replace(/["`[\]]/g, "");
  const parts = cleaned.split(".");

  if (parts.length >= 2) {
    return {
      tableName: resolveTableName(parts[0], tables),
      columnName: sanitizeIdentifier(parts[1]),
      fragment,
    };
  }

  return {
    tableName: getDefaultTable(tables),
    columnName: sanitizeIdentifier(cleaned),
    fragment,
  };
};

const extractWhereColumns = (
  sql: string,
  tables: TableReference[],
): ColumnReference[] => {
  const where = sql.match(
    /\bwhere\b([\s\S]*?)(\bgroup\s+by\b|\border\s+by\b|\bhaving\b|\blimit\b|\boffset\b|\bfetch\b|$)/i,
  )?.[1];

  if (!where) {
    return [];
  }

  const columns: ColumnReference[] = [];
  const pattern =
    /((?:[a-zA-Z_][\w"]*\.)?[a-zA-Z_][\w"]*)\s*(=|>|<|>=|<=|<>|!=|\blike\b|\bin\b)/gi;

  for (const match of where.matchAll(pattern)) {
    const rawColumn = match[1];
    if (reservedWords.has(rawColumn.toLowerCase())) {
      continue;
    }
    columns.push(toColumnReference(rawColumn, match[0], tables));
  }

  return columns;
};

const extractJoinColumns = (
  sql: string,
  tables: TableReference[],
): ColumnReference[] => {
  const columns: ColumnReference[] = [];
  const pattern =
    /\bon\s+((?:[a-zA-Z_][\w"]*\.)?[a-zA-Z_][\w"]*)\s*=\s*((?:[a-zA-Z_][\w"]*\.)?[a-zA-Z_][\w"]*)/gi;

  for (const match of sql.matchAll(pattern)) {
    columns.push(toColumnReference(match[1], match[0], tables));
    columns.push(toColumnReference(match[2], match[0], tables));
  }

  return columns;
};

const extractClauseColumns = (
  sql: string,
  clause: "order by" | "group by",
  tables: TableReference[],
): ColumnReference[] => {
  const pattern = new RegExp(
    `\\b${clause.replace(" ", "\\s+")}\\b([\\s\\S]*?)(\\blimit\\b|\\boffset\\b|\\bfetch\\b|$)`,
    "i",
  );
  const clauseText = sql.match(pattern)?.[1];

  if (!clauseText) {
    return [];
  }

  return clauseText
    .split(",")
    .map((column) => column.replace(/\basc\b|\bdesc\b/gi, "").trim())
    .filter(Boolean)
    .map((column) => toColumnReference(column, column, tables));
};

const extractFunctionalColumns = (
  sql: string,
  tables: TableReference[],
): Array<ColumnReference & { expression: string }> => {
  const columns: Array<ColumnReference & { expression: string }> = [];
  const pattern =
    /\b(lower|upper|trim|date)\s*\(\s*((?:[a-zA-Z_][\w"]*\.)?[a-zA-Z_][\w"]*)\s*\)/gi;

  for (const match of sql.matchAll(pattern)) {
    const column = toColumnReference(match[2], match[0], tables);
    columns.push({
      ...column,
      expression: `${match[1].toUpperCase()}(${column.columnName})`,
    });
  }

  return columns;
};

const dedupeSuggestions = (suggestions: IndexSuggestion[]): IndexSuggestion[] => {
  const seen = new Set<string>();

  return suggestions.filter((suggestion) => {
    const key = `${suggestion.tableName}:${suggestion.expression ?? suggestion.columns.join(",")}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const suggestIndexesForStatement = (
  sql: string,
  _dialect: SqlDialect = "postgresql",
): IndexSuggestion[] => {
  const cleanedSql = stripSqlComments(sql);
  const tables = extractTableReferences(cleanedSql);
  const suggestions: IndexSuggestion[] = [];
  const whereColumns = extractWhereColumns(cleanedSql, tables);
  const joinColumns = extractJoinColumns(cleanedSql, tables);
  const orderColumns = extractClauseColumns(cleanedSql, "order by", tables);
  const groupColumns = extractClauseColumns(cleanedSql, "group by", tables);
  const functionalColumns = extractFunctionalColumns(cleanedSql, tables);

  whereColumns.forEach((column) => {
    suggestions.push(
      createSuggestion({
        tableName: column.tableName,
        columns: [column.columnName],
        source: "where",
        confidence: "high",
        relatedQueryFragment: column.fragment,
      }),
    );
  });

  joinColumns.forEach((column) => {
    suggestions.push(
      createSuggestion({
        tableName: column.tableName,
        columns: [column.columnName],
        source: "join",
        confidence: "high",
        relatedQueryFragment: column.fragment,
      }),
    );
  });

  orderColumns.forEach((column) => {
    suggestions.push(
      createSuggestion({
        tableName: column.tableName,
        columns: [column.columnName],
        source: "order-by",
        confidence: "medium",
        relatedQueryFragment: column.fragment,
      }),
    );
  });

  groupColumns.forEach((column) => {
    suggestions.push(
      createSuggestion({
        tableName: column.tableName,
        columns: [column.columnName],
        source: "group-by",
        confidence: "medium",
        relatedQueryFragment: column.fragment,
      }),
    );
  });

  functionalColumns.forEach((column) => {
    suggestions.push(
      createSuggestion({
        tableName: column.tableName,
        columns: [column.columnName],
        expression: column.expression,
        source: "functional",
        confidence: "medium",
        relatedQueryFragment: column.fragment,
      }),
    );
  });

  const whereColumnsByTable = whereColumns.reduce<Record<string, string[]>>(
    (grouped, column) => ({
      ...grouped,
      [column.tableName]: uniqueValues([
        ...(grouped[column.tableName] ?? []),
        column.columnName,
      ]),
    }),
    {},
  );

  Object.entries(whereColumnsByTable).forEach(([tableName, columns]) => {
    if (columns.length < 2) {
      return;
    }

    suggestions.push(
      createSuggestion({
        tableName,
        columns,
        source: "composite",
        confidence: "medium",
        relatedQueryFragment: columns.join(", "),
      }),
    );
  });

  const orderColumnsByTable = orderColumns.reduce<Record<string, string[]>>(
    (grouped, column) => ({
      ...grouped,
      [column.tableName]: uniqueValues([
        ...(grouped[column.tableName] ?? []),
        column.columnName,
      ]),
    }),
    {},
  );

  Object.entries(whereColumnsByTable).forEach(([tableName, whereColumnNames]) => {
    const orderedColumnNames = orderColumnsByTable[tableName] ?? [];
    const compositeColumns = uniqueValues([
      ...whereColumnNames,
      ...orderedColumnNames,
    ]);

    if (whereColumnNames.length === 0 || orderedColumnNames.length === 0) {
      return;
    }

    suggestions.push(
      createSuggestion({
        tableName,
        columns: compositeColumns,
        source: "composite",
        confidence: "medium",
        relatedQueryFragment: `WHERE ${whereColumnNames.join(", ")} + ORDER BY ${orderedColumnNames.join(", ")}`,
      }),
    );
  });

  return dedupeSuggestions(suggestions);
};

export const suggestIndexes = (
  sql: string,
  dialect: SqlDialect = "postgresql",
): IndexSuggestion[] =>
  dedupeSuggestions(
    splitSqlStatements(sql).flatMap((statement) =>
      suggestIndexesForStatement(statement, dialect),
    ),
  ).slice(0, 10);
