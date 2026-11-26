// Oracle Database 19c Optimizer Statistics Concepts, Example 10-9:
// https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/optimizer-statistics-concepts.html
export const sampleOracleXplan = `SQL_ID  b74nw722wjvy3, child number 1
Plan hash value: 1683234692
--------------------------------------------------------------------------------
| Id  | Operation         | Name      | Starts | E-Rows | A-Rows | A-Time   | Buffers |
--------------------------------------------------------------------------------
|   0 | SELECT STATEMENT  |           |      1 |        |     29 |00:00:00.01|      17 |
|*  1 |  TABLE ACCESS FULL| CUSTOMERS |      1 |     29 |     29 |00:00:00.01|      17 |
--------------------------------------------------------------------------------
Predicate Information (identified by operation id):
---------------------------------------------------
   1 - filter(("CUST_STATE_PROVINCE"='CA' AND "COUNTRY_ID"='US'))
Note
-----
   - cardinality feedback used for this statement`;
