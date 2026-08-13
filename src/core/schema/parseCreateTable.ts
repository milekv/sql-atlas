import type {
  ParsedSchema,
  SchemaColumn,
  SchemaForeignKey,
  SchemaTable,
} from "./types";

const constraintWords = new Set([
  "not",
  "null",
  "default",
  "primary",
  "unique",
  "references",
  "check",
  "constraint",
  "generated",
  "collate",
]);

const normalizeIdentifier = (identifier: string): string =>
  identifier
    .trim()
    .split(".")
    .map((part) => part.trim().replace(/^"|"$/g, ""))
    .join(".");

const splitTopLevel = (value: string): string[] => {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: string | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (quote) {
      if (character === quote && value[index - 1] !== "\\") {
        quote = null;
      }
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }

    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;

    if (character === "," && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
};

const readCreateTableBlocks = (
  sql: string,
): Array<{ name: string; body: string }> => {
  const blocks: Array<{ name: string; body: string }> = [];
  const pattern = /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?((?:"[^"]+"|[\w$]+)(?:\s*\.\s*(?:"[^"]+"|[\w$]+))?)\s*\(/gi;

  for (const match of sql.matchAll(pattern)) {
    const openingIndex = (match.index ?? 0) + match[0].lastIndexOf("(");
    let depth = 0;
    let quote: string | null = null;
    let closingIndex = -1;

    for (let index = openingIndex; index < sql.length; index += 1) {
      const character = sql[index];

      if (quote) {
        if (character === quote && sql[index - 1] !== "\\") quote = null;
        continue;
      }

      if (character === "'" || character === '"') {
        quote = character;
        continue;
      }

      if (character === "(") depth += 1;
      if (character === ")") {
        depth -= 1;
        if (depth === 0) {
          closingIndex = index;
          break;
        }
      }
    }

    if (closingIndex !== -1) {
      blocks.push({
        name: normalizeIdentifier(match[1]),
        body: sql.slice(openingIndex + 1, closingIndex),
      });
    }
  }

  return blocks;
};

const parseIdentifierList = (value: string): string[] =>
  splitTopLevel(value).map(normalizeIdentifier);

const parseColumn = (definition: string): SchemaColumn | null => {
  const match = definition.match(/^((?:"[^"]+"|[\w$]+))\s+([\s\S]+)$/);
  if (!match) return null;

  const name = normalizeIdentifier(match[1]);
  const remainder = match[2].trim();
  const tokens = remainder.split(/\s+/);
  let typeEnd = tokens.length;

  for (let index = 0; index < tokens.length; index += 1) {
    if (constraintWords.has(tokens[index].toLowerCase())) {
      typeEnd = index;
      break;
    }
  }

  return {
    name,
    dataType: tokens.slice(0, typeEnd).join(" ") || "unknown",
    nullable: !/\bnot\s+null\b/i.test(remainder),
    primaryKey: /\bprimary\s+key\b/i.test(remainder),
    unique: /\bunique\b/i.test(remainder),
  };
};

const foreignKeyFromDefinition = (
  definition: string,
  tableName: string,
  inlineColumn?: string,
): Omit<SchemaForeignKey, "id" | "resolved"> | null => {
  const tableConstraint = definition.match(
    /\bforeign\s+key\s*\(([^)]+)\)\s+references\s+((?:"[^"]+"|[\w$]+)(?:\s*\.\s*(?:"[^"]+"|[\w$]+))?)\s*\(([^)]+)\)/i,
  );
  const inlineConstraint = definition.match(
    /\breferences\s+((?:"[^"]+"|[\w$]+)(?:\s*\.\s*(?:"[^"]+"|[\w$]+))?)\s*\(([^)]+)\)/i,
  );

  if (tableConstraint) {
    return {
      sourceTable: tableName,
      sourceColumns: parseIdentifierList(tableConstraint[1]),
      targetTable: normalizeIdentifier(tableConstraint[2]),
      targetColumns: parseIdentifierList(tableConstraint[3]),
    };
  }

  if (inlineColumn && inlineConstraint) {
    return {
      sourceTable: tableName,
      sourceColumns: [inlineColumn],
      targetTable: normalizeIdentifier(inlineConstraint[1]),
      targetColumns: parseIdentifierList(inlineConstraint[2]),
    };
  }

  return null;
};

export const parseCreateTableSchema = (sql: string): ParsedSchema => {
  const blocks = readCreateTableBlocks(sql);
  const tables: SchemaTable[] = [];
  const rawForeignKeys: Array<Omit<SchemaForeignKey, "id" | "resolved">> = [];
  const warnings: ParsedSchema["warnings"] = [];

  blocks.forEach((block) => {
    const columns: SchemaColumn[] = [];
    const tablePrimaryKeys = new Set<string>();

    splitTopLevel(block.body).forEach((definition) => {
      const withoutConstraintName = definition.replace(
        /^constraint\s+(?:"[^"]+"|[\w$]+)\s+/i,
        "",
      );
      const tablePrimaryKey = withoutConstraintName.match(
        /^primary\s+key\s*\(([^)]+)\)/i,
      );

      if (tablePrimaryKey) {
        parseIdentifierList(tablePrimaryKey[1]).forEach((column) =>
          tablePrimaryKeys.add(column),
        );
        return;
      }

      const tableForeignKey = foreignKeyFromDefinition(
        withoutConstraintName,
        block.name,
      );
      if (/^foreign\s+key\b/i.test(withoutConstraintName)) {
        if (tableForeignKey) rawForeignKeys.push(tableForeignKey);
        return;
      }

      if (/^(unique|check|exclude)\b/i.test(withoutConstraintName)) return;

      const column = parseColumn(withoutConstraintName);
      if (!column) {
        warnings.push({
          code: "definition-unparsed",
          table: block.name,
          definition,
        });
        return;
      }

      columns.push(column);
      const inlineForeignKey = foreignKeyFromDefinition(
        withoutConstraintName,
        block.name,
        column.name,
      );
      if (inlineForeignKey) rawForeignKeys.push(inlineForeignKey);
    });

    columns.forEach((column) => {
      if (tablePrimaryKeys.has(column.name)) column.primaryKey = true;
    });

    if (columns.length === 0) {
      warnings.push({ code: "no-columns", table: block.name });
    }

    tables.push({ name: block.name, columns });
  });

  const tableNames = new Set(tables.map((table) => table.name));
  const foreignKeys = rawForeignKeys.map((foreignKey, index) => ({
    ...foreignKey,
    id: `${foreignKey.sourceTable}:${foreignKey.sourceColumns.join(",")}:${index}`,
    resolved: tableNames.has(foreignKey.targetTable),
  }));

  foreignKeys
    .filter((foreignKey) => !foreignKey.resolved)
    .forEach((foreignKey) => {
      warnings.push({
        code: "missing-reference",
        table: foreignKey.targetTable,
      });
    });

  if (sql.trim() && blocks.length === 0) {
    warnings.push({ code: "no-create-table" });
  }

  return { tables, foreignKeys, warnings };
};
