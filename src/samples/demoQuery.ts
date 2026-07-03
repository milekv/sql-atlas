export const demoSql = `SELECT *
FROM customers
WHERE LOWER(email) = LOWER(:email)
ORDER BY created_at DESC;`;
