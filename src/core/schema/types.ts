export interface SchemaColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
}

export interface SchemaForeignKey {
  id: string;
  sourceTable: string;
  sourceColumns: string[];
  targetTable: string;
  targetColumns: string[];
  resolved: boolean;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

export type SchemaWarning =
  | { code: "definition-unparsed"; table: string; definition: string }
  | { code: "no-columns"; table: string }
  | { code: "missing-reference"; table: string }
  | { code: "no-create-table" };

export interface ParsedSchema {
  tables: SchemaTable[];
  foreignKeys: SchemaForeignKey[];
  warnings: SchemaWarning[];
}
