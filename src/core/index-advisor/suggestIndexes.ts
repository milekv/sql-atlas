import {
  splitSqlStatements,
  maskSqlStructure,
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
  pl: "Zweryfikuj na rzeczywistych danych przez EXPLAIN ANALYZE. Indeksy mogą przyspieszać SELECT, ale spowalniać INSERT, UPDATE i DELETE oraz zajmować miejsce.",
};
const sourceLabels: Record<IndexSuggestionSource, LocalizedText> = {
  where: { en: "filter", pl: "filtrowania" },
  join: { en: "join", pl: "łączenia tabel" },
  "order-by": { en: "sorting", pl: "sortowania" },
  "group-by": { en: "grouping", pl: "grupowania" },
  functional: { en: "expression filter", pl: "filtrowania wyrażeniem" },
  composite: { en: "combined filter and sort", pl: "filtra i sortowania" },
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
      en: `Candidate index for ${sourceLabels[source].en} on ${tableName}.`,
      pl: `Kandydat na indeks do ${sourceLabels[source].pl} w tabeli ${tableName}.`,
    },
    confidence,
    relatedQueryFragment,
    educationalWarning,
  };
};

const extractTableReferences = (sql: string): TableReference[] => {
  const refs: TableReference[] = [];
  const cteNames = new Set([...sql.matchAll(/\b(?:with|,)\s*([a-zA-Z_]\w*)\s+as\s*\(/gi)]
    .map((match) => sanitizeIdentifier(match[1])));
  const pattern =
    /\b(?:from|join)\s+([a-zA-Z_][\w."]*)\s*(?:as\s+)?([a-zA-Z_][\w"]*)?/gi;

  for (const match of sql.matchAll(pattern)) {
    // The current DDL template cannot preserve schema-qualified or quoted names.
    if (match[1].includes(".") || match[1].includes('"')) continue;
    const tableName = sanitizeIdentifier(match[1]);
    const rawAlias = match[2] ? sanitizeIdentifier(match[2]) : tableName;
    const alias = reservedWords.has(rawAlias) ? tableName : rawAlias;
    if (!cteNames.has(tableName)) refs.push({ name: tableName, alias });
  }

  return refs;
};

const getDefaultTable = (tables: TableReference[]): string =>
  tables.length === 1 ? tables[0].name : "table_name";

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
      ?.name ?? "table_name"
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
    .filter((column) => /^(?:[a-zA-Z_]\w*\.)?[a-zA-Z_]\w*$/.test(column))
    .map((column) => toColumnReference(column, column, tables));
};

const extractFunctionalColumns = (
  sql: string,
  tables: TableReference[],
): Array<ColumnReference & { expression: string }> => {
  const columns: Array<ColumnReference & { expression: string }> = [];
  const pattern =
    /\b(lower|upper|trim|date)\s*\(\s*((?:[a-zA-Z_][\w"]*\.)?[a-zA-Z_][\w"]*)\s*\)\s*(?:=|<>|!=|<=|>=|<|>|\blike\b|\bin\b)/gi;

  const where = sql.match(/\bwhere\b([\s\S]*?)(?:\bgroup\s+by\b|\border\s+by\b|\bhaving\b|\blimit\b|$)/i)?.[1] ?? "";
  for (const match of where.matchAll(pattern)) {
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
  // Mask values/comments as well as quoted identifiers we cannot safely resolve.
  const cleanedSql = maskSqlStructure(sql);
  const tables = extractTableReferences(cleanedSql);
  if (tables.length === 0) return [];
  const physicalTables = new Set(tables.map((table) => table.name));
  // An unqualified column in a CTE query may refer to a derived relation.
  const scopedTables = /\bwith\s+[a-zA-Z_]\w*\s+as\s*\(/i.test(cleanedSql)
    ? [...tables, { name: "__derived", alias: "__derived" }] : tables;
  const suggestions: IndexSuggestion[] = [];
  const known = <T extends ColumnReference>(columns: T[]): T[] => columns.filter((column) =>
    physicalTables.has(column.tableName) && column.columnName.length > 0);
  const whereColumns = known(extractWhereColumns(cleanedSql, scopedTables));
  const joinColumns = known(extractJoinColumns(cleanedSql, scopedTables));
  const orderColumns = known(extractClauseColumns(cleanedSql, "order by", scopedTables));
  const groupColumns = known(extractClauseColumns(cleanedSql, "group by", scopedTables));
  const functionalColumns = known(extractFunctionalColumns(cleanedSql, scopedTables));
  const hasDisjunction = /\bor\b/i.test(cleanedSql.match(
    /\bwhere\b([\s\S]*?)(?:\bgroup\s+by\b|\border\s+by\b|\bhaving\b|\blimit\b|$)/i,
  )?.[1] ?? "");

  whereColumns.forEach((column) => {
    suggestions.push(
      createSuggestion({
        tableName: column.tableName,
        columns: [column.columnName],
        source: "where",
        confidence: "medium",
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
        confidence: "medium",
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
    if (columns.length < 2 || hasDisjunction) {
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

    if (whereColumnNames.length === 0 || orderedColumnNames.length === 0 || hasDisjunction) {
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
  dialect !== "postgresql" ? [] : dedupeSuggestions(
    splitSqlStatements(sql).flatMap((statement) =>
      suggestIndexesForStatement(statement, dialect),
    ),
  ).slice(0, 10);
