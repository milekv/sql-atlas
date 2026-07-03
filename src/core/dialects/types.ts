import type { Language } from "../../types";
import type { SqlDialect } from "../analyzer/types";

export interface DialectExample {
  dialect: Exclude<SqlDialect, "generic">;
  sql: string;
}

export interface DialectComparisonTopic {
  id: string;
  translations: Record<
    Language,
    {
      concept: string;
      explanation: string;
      notes: string;
    }
  >;
  examples: DialectExample[];
}
