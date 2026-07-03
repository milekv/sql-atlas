import type { DialectComparisonTopic } from "./types";

export const dialectComparisonTopics: DialectComparisonTopic[] = [
  {
    id: "limit-rows",
    translations: {
      en: { concept: "Limit rows", explanation: "Return only a fixed number of rows.", notes: "Always pair row limits with ORDER BY when order matters." },
      pl: { concept: "Limit wierszy", explanation: "Zwroc tylko okreslona liczbe wierszy.", notes: "Lacz limity z ORDER BY, gdy kolejnosc ma znaczenie." },
    },
    examples: [
      { dialect: "postgresql", sql: "SELECT * FROM orders LIMIT 10;" },
      { dialect: "mysql", sql: "SELECT * FROM orders LIMIT 10;" },
      { dialect: "oracle", sql: "SELECT * FROM orders FETCH FIRST 10 ROWS ONLY;" },
      { dialect: "sqlite", sql: "SELECT * FROM orders LIMIT 10;" },
      { dialect: "sqlserver", sql: "SELECT TOP 10 * FROM orders;" },
    ],
  },
  {
    id: "auto-increment",
    translations: {
      en: { concept: "Auto increment", explanation: "Generate numeric identifiers automatically.", notes: "Identity and sequence behavior differs between engines." },
      pl: { concept: "Auto increment", explanation: "Generuj numeryczne identyfikatory automatycznie.", notes: "Identity i sequence roznia sie miedzy silnikami." },
    },
    examples: [
      { dialect: "postgresql", sql: "id BIGINT GENERATED ALWAYS AS IDENTITY" },
      { dialect: "mysql", sql: "id BIGINT AUTO_INCREMENT PRIMARY KEY" },
      { dialect: "oracle", sql: "id NUMBER GENERATED ALWAYS AS IDENTITY" },
      { dialect: "sqlite", sql: "id INTEGER PRIMARY KEY AUTOINCREMENT" },
      { dialect: "sqlserver", sql: "id BIGINT IDENTITY(1,1) PRIMARY KEY" },
    ],
  },
  {
    id: "current-date",
    translations: {
      en: { concept: "Current date", explanation: "Read the current date or timestamp.", notes: "Timestamp precision and timezone behavior are dialect-specific." },
      pl: { concept: "Aktualna data", explanation: "Odczytaj aktualna date albo timestamp.", notes: "Precyzja i strefy czasowe zaleza od dialektu." },
    },
    examples: [
      { dialect: "postgresql", sql: "SELECT CURRENT_DATE, NOW();" },
      { dialect: "mysql", sql: "SELECT CURRENT_DATE(), NOW();" },
      { dialect: "oracle", sql: "SELECT CURRENT_DATE, SYSTIMESTAMP FROM dual;" },
      { dialect: "sqlite", sql: "SELECT date('now'), datetime('now');" },
      { dialect: "sqlserver", sql: "SELECT CAST(GETDATE() AS date), SYSDATETIME();" },
    ],
  },
  {
    id: "string-concat",
    translations: {
      en: { concept: "String concatenation", explanation: "Combine text values.", notes: "NULL handling differs; test behavior before porting." },
      pl: { concept: "Konkatenacja tekstu", explanation: "Lacz wartosci tekstowe.", notes: "Obsluga NULL rozni sie; testuj przed przeniesieniem." },
    },
    examples: [
      { dialect: "postgresql", sql: "SELECT first_name || ' ' || last_name FROM users;" },
      { dialect: "mysql", sql: "SELECT CONCAT(first_name, ' ', last_name) FROM users;" },
      { dialect: "oracle", sql: "SELECT first_name || ' ' || last_name FROM users;" },
      { dialect: "sqlite", sql: "SELECT first_name || ' ' || last_name FROM users;" },
      { dialect: "sqlserver", sql: "SELECT CONCAT(first_name, ' ', last_name) FROM users;" },
    ],
  },
  {
    id: "upsert",
    translations: {
      en: { concept: "Upsert", explanation: "Insert or update on key conflict.", notes: "Reliable upserts require unique keys." },
      pl: { concept: "Upsert", explanation: "Wstaw albo aktualizuj przy konflikcie klucza.", notes: "Niezawodne upserty wymagaja unikalnych kluczy." },
    },
    examples: [
      { dialect: "postgresql", sql: "INSERT INTO users(email) VALUES($1) ON CONFLICT (email) DO UPDATE SET updated_at = NOW();" },
      { dialect: "mysql", sql: "INSERT INTO users(email) VALUES(?) ON DUPLICATE KEY UPDATE updated_at = NOW();" },
      { dialect: "oracle", sql: "MERGE INTO users u USING source s ON (u.email = s.email) WHEN MATCHED THEN UPDATE SET ..." },
      { dialect: "sqlite", sql: "INSERT INTO users(email) VALUES(?) ON CONFLICT(email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;" },
      { dialect: "sqlserver", sql: "MERGE INTO users AS target USING source ON target.email = source.email WHEN MATCHED THEN UPDATE SET ...;" },
    ],
  },
  {
    id: "pagination",
    translations: {
      en: { concept: "Pagination", explanation: "Fetch a page of ordered rows.", notes: "Keyset pagination is usually better for deep pages." },
      pl: { concept: "Paginacja", explanation: "Pobierz strone uporzadkowanych wierszy.", notes: "Keyset pagination zwykle lepsza dla glebokich stron." },
    },
    examples: [
      { dialect: "postgresql", sql: "ORDER BY created_at DESC LIMIT 50 OFFSET 100;" },
      { dialect: "mysql", sql: "ORDER BY created_at DESC LIMIT 50 OFFSET 100;" },
      { dialect: "oracle", sql: "ORDER BY created_at DESC OFFSET 100 ROWS FETCH NEXT 50 ROWS ONLY;" },
      { dialect: "sqlite", sql: "ORDER BY created_at DESC LIMIT 50 OFFSET 100;" },
      { dialect: "sqlserver", sql: "ORDER BY created_at DESC OFFSET 100 ROWS FETCH NEXT 50 ROWS ONLY;" },
    ],
  },
  {
    id: "boolean-type",
    translations: {
      en: { concept: "Boolean type", explanation: "Store true/false values.", notes: "Some engines use numeric or constrained alternatives." },
      pl: { concept: "Typ boolean", explanation: "Przechowuj wartosci true/false.", notes: "Niektore silniki uzywaja liczb albo constraints." },
    },
    examples: [
      { dialect: "postgresql", sql: "is_active BOOLEAN NOT NULL DEFAULT true" },
      { dialect: "mysql", sql: "is_active BOOLEAN NOT NULL DEFAULT true" },
      { dialect: "oracle", sql: "is_active NUMBER(1) CHECK (is_active IN (0, 1))" },
      { dialect: "sqlite", sql: "is_active INTEGER NOT NULL CHECK (is_active IN (0, 1))" },
      { dialect: "sqlserver", sql: "is_active BIT NOT NULL DEFAULT 1" },
    ],
  },
  {
    id: "json-access",
    translations: {
      en: { concept: "JSON field access", explanation: "Read values from JSON documents.", notes: "Index support and operators differ widely." },
      pl: { concept: "Dostep do JSON", explanation: "Czytaj wartosci z dokumentow JSON.", notes: "Wsparcie indeksow i operatory mocno sie roznia." },
    },
    examples: [
      { dialect: "postgresql", sql: "SELECT data ->> 'email' FROM events;" },
      { dialect: "mysql", sql: "SELECT JSON_UNQUOTE(JSON_EXTRACT(data, '$.email')) FROM events;" },
      { dialect: "oracle", sql: "SELECT JSON_VALUE(data, '$.email') FROM events;" },
      { dialect: "sqlite", sql: "SELECT json_extract(data, '$.email') FROM events;" },
      { dialect: "sqlserver", sql: "SELECT JSON_VALUE(data, '$.email') FROM events;" },
    ],
  },
  {
    id: "cte-support",
    translations: {
      en: { concept: "CTE support", explanation: "Use WITH clauses for named query steps.", notes: "Recursive and materialization behavior differs." },
      pl: { concept: "Wsparcie CTE", explanation: "Uzywaj WITH do nazwanych krokow zapytania.", notes: "Rekurencja i materializacja roznia sie." },
    },
    examples: [
      { dialect: "postgresql", sql: "WITH recent AS (SELECT * FROM orders) SELECT * FROM recent;" },
      { dialect: "mysql", sql: "WITH recent AS (SELECT * FROM orders) SELECT * FROM recent;" },
      { dialect: "oracle", sql: "WITH recent AS (SELECT * FROM orders) SELECT * FROM recent;" },
      { dialect: "sqlite", sql: "WITH recent AS (SELECT * FROM orders) SELECT * FROM recent;" },
      { dialect: "sqlserver", sql: "WITH recent AS (SELECT * FROM orders) SELECT * FROM recent;" },
    ],
  },
  {
    id: "window-functions",
    translations: {
      en: { concept: "Window functions", explanation: "Compute values across related rows.", notes: "Modern versions support them, but syntax details can vary." },
      pl: { concept: "Funkcje okna", explanation: "Licz wartosci na powiazanych wierszach.", notes: "Nowoczesne wersje wspieraja je, ale szczegoly skladni sie roznia." },
    },
    examples: [
      { dialect: "postgresql", sql: "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at)" },
      { dialect: "mysql", sql: "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at)" },
      { dialect: "oracle", sql: "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at)" },
      { dialect: "sqlite", sql: "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at)" },
      { dialect: "sqlserver", sql: "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at)" },
    ],
  },
  {
    id: "date-formatting",
    translations: {
      en: { concept: "Date formatting", explanation: "Format temporal values as strings.", notes: "Prefer returning typed dates to applications when possible." },
      pl: { concept: "Formatowanie dat", explanation: "Formatuj wartosci czasowe jako tekst.", notes: "Gdy mozliwe, zwracaj aplikacji typowane daty." },
    },
    examples: [
      { dialect: "postgresql", sql: "TO_CHAR(created_at, 'YYYY-MM-DD')" },
      { dialect: "mysql", sql: "DATE_FORMAT(created_at, '%Y-%m-%d')" },
      { dialect: "oracle", sql: "TO_CHAR(created_at, 'YYYY-MM-DD')" },
      { dialect: "sqlite", sql: "strftime('%Y-%m-%d', created_at)" },
      { dialect: "sqlserver", sql: "FORMAT(created_at, 'yyyy-MM-dd')" },
    ],
  },
  {
    id: "case-insensitive-search",
    translations: {
      en: { concept: "Case-insensitive search", explanation: "Compare text without case sensitivity.", notes: "Collation, operators, and indexes all matter." },
      pl: { concept: "Wyszukiwanie case-insensitive", explanation: "Porownuj tekst bez wrazliwosci na wielkosc liter.", notes: "Kolacja, operatory i indeksy maja znaczenie." },
    },
    examples: [
      { dialect: "postgresql", sql: "WHERE email ILIKE 'a%@example.com'" },
      { dialect: "mysql", sql: "WHERE email LIKE 'a%@example.com' COLLATE utf8mb4_general_ci" },
      { dialect: "oracle", sql: "WHERE LOWER(email) LIKE LOWER(:pattern)" },
      { dialect: "sqlite", sql: "WHERE email LIKE 'a%@example.com' COLLATE NOCASE" },
      { dialect: "sqlserver", sql: "WHERE email LIKE @pattern COLLATE Latin1_General_CI_AS" },
    ],
  },
];
