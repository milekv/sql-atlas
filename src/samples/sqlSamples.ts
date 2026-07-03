import type { TranslationKey } from "../i18n/types";

export interface SqlSample {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  noticeKey: TranslationKey;
  sql: string;
}

export const sqlSamples: SqlSample[] = [
  {
    id: "simple-select-star",
    titleKey: "sample.selectStar",
    descriptionKey: "sample.selectStar.description",
    noticeKey: "sample.selectStar.notice",
    sql: "SELECT *\nFROM customers;",
  },
  {
    id: "dangerous-delete",
    titleKey: "sample.dangerousDelete",
    descriptionKey: "sample.dangerousDelete.description",
    noticeKey: "sample.dangerousDelete.notice",
    sql: "DELETE FROM sessions;",
  },
  {
    id: "dangerous-update",
    titleKey: "sample.dangerousUpdate",
    descriptionKey: "sample.dangerousUpdate.description",
    noticeKey: "sample.dangerousUpdate.notice",
    sql: "UPDATE customers\nSET status = 'inactive';",
  },
  {
    id: "lower-email",
    titleKey: "sample.lowerEmail",
    descriptionKey: "sample.lowerEmail.description",
    noticeKey: "sample.lowerEmail.notice",
    sql: "SELECT id, email, created_at\nFROM customers\nWHERE LOWER(email) = LOWER(:email)\nORDER BY created_at DESC;",
  },
  {
    id: "slow-like",
    titleKey: "sample.slowLike",
    descriptionKey: "sample.slowLike.description",
    noticeKey: "sample.slowLike.notice",
    sql: "SELECT id, title\nFROM articles\nWHERE title LIKE '%database%'\nORDER BY created_at DESC;",
  },
  {
    id: "join-missing-indexes",
    titleKey: "sample.joinMissingIndexes",
    descriptionKey: "sample.joinMissingIndexes.description",
    noticeKey: "sample.joinMissingIndexes.notice",
    sql: "SELECT o.id, c.email, p.sku\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nJOIN order_items oi ON oi.order_id = o.id\nJOIN products p ON p.id = oi.product_id\nWHERE c.email = :email\nORDER BY o.created_at DESC;",
  },
  {
    id: "offset-pagination",
    titleKey: "sample.offsetPagination",
    descriptionKey: "sample.offsetPagination.description",
    noticeKey: "sample.offsetPagination.notice",
    sql: "SELECT id, created_at\nFROM audit_log\nWHERE tenant_id = :tenant_id\nORDER BY created_at DESC\nLIMIT 50 OFFSET 50000;",
  },
  {
    id: "group-by-reporting",
    titleKey: "sample.groupBy",
    descriptionKey: "sample.groupBy.description",
    noticeKey: "sample.groupBy.notice",
    sql: "SELECT customer_id, status, DATE(created_at) AS order_day, COUNT(*) AS order_count\nFROM orders\nWHERE created_at >= CURRENT_DATE - INTERVAL '90 days'\nGROUP BY customer_id, status, DATE(created_at)\nORDER BY order_day DESC;",
  },
  {
    id: "cross-join-mistake",
    titleKey: "sample.crossJoin",
    descriptionKey: "sample.crossJoin.description",
    noticeKey: "sample.crossJoin.notice",
    sql: "SELECT c.id, p.id\nFROM customers c\nCROSS JOIN products p\nWHERE c.status = 'active';",
  },
  {
    id: "optimized-query",
    titleKey: "sample.optimizedQuery",
    descriptionKey: "sample.optimizedQuery.description",
    noticeKey: "sample.optimizedQuery.notice",
    sql: "SELECT id, email, created_at\nFROM customers\nWHERE email = :email\nORDER BY created_at DESC\nLIMIT 25;",
  },
];
