const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const highlightSql = (sql: string): string => {
  const escaped = escapeHtml(sql);

  return escaped
    .replace(
      /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|INSERT|UPDATE|DELETE|CREATE|INDEX|TABLE|BEGIN|COMMIT|ROLLBACK|WITH|AS|AND|OR|NOT|IN|EXISTS|NULL|IS|DISTINCT|FETCH|TOP)\b/gi,
      '<span class="keyword">$1</span>',
    )
    .replace(
      /\b(COUNT|SUM|AVG|MIN|MAX|LOWER|UPPER|DATE_TRUNC|COALESCE|NOW|CURRENT_DATE|RANDOM|RAND)\s*(?=\()/gi,
      '<span class="function">$1</span>',
    )
    .replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>')
    .replace(/\b\d+(?:\.\d+)?\b/g, '<span class="number">$&</span>');
};
