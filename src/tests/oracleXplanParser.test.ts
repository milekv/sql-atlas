import { describe, expect, it } from "vitest";
import { parseOracleXplan } from "../core/explain/parseOracleXplan";

// Column layout and the two-operation example follow Oracle's public
// Optimizer Statistics Concepts, 19c, Example 10-9.
const oracleSample = `SQL_ID  b74nw722wjvy3, child number 1
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

describe("Oracle DBMS_XPLAN text import", () => {
  it("reads Oracle's published DISPLAY_CURSOR sample without treating cost as time", () => {
    const plan = parseOracleXplan(oracleSample);
    expect(plan.kind).toBe("actual");
    expect(plan.sqlId).toBe("b74nw722wjvy3");
    expect(plan.childNumber).toBe(1);
    expect(plan.planHashValue).toBe("1683234692");
    expect(plan.nodes).toHaveLength(2);
    expect(plan.root.children[0]).toMatchObject({
      id: 1, operation: "TABLE ACCESS FULL", objectName: "CUSTOMERS",
      starts: 1, estimatedRows: 29, actualRows: 29, buffers: 17,
      actualTimeMs: 10,
    });
    expect(plan.root.children[0].predicates).toEqual(["filter((\"CUST_STATE_PROVINCE\"='CA' AND \"COUNTRY_ID\"='US'))"]);
    expect(plan.notes).toEqual(["cardinality feedback used for this statement"]);
  });

  it("preserves hierarchy, access/filter predicates and estimated-only metrics", () => {
    const plan = parseOracleXplan(`Plan hash value: 12345
| Id | Operation                    | Name        | Rows | Bytes | Cost (%CPU) | Time     |
|  0 | SELECT STATEMENT             |             |   10 |   500 |    22   (2) | 00:00:01 |
|  1 |  NESTED LOOPS                |             |   10 |   500 |    22   (2) | 00:00:01 |
|* 2 |   INDEX RANGE SCAN           | IX_ORDERS   |   10 |   200 |     4   (0) | 00:00:01 |
|  3 |   TABLE ACCESS BY INDEX ROWID| CUSTOMERS   |    1 |    30 |     2   (0) | 00:00:01 |
Predicate Information (identified by operation id):
   2 - access("O"."CREATED_AT">=:B1)
   3 - filter("C"."STATUS"='A')`);
    expect(plan.kind).toBe("estimated");
    expect(plan.root.children[0].children.map((node) => node.id)).toEqual([2, 3]);
    expect(plan.nodes[2]).toMatchObject({ estimatedRows: 10, cost: 4, actualRows: undefined, actualTimeMs: undefined });
    expect(plan.nodes[2].predicates).toEqual(['access("O"."CREATED_AT">=:B1)']);
    expect(plan.nodes[3].predicates).toEqual(['filter("C"."STATUS"=\'A\')']);
  });

  it("reads Oracle's published nested-loops cursor plan with Start/Buff column aliases", () => {
    // Oracle 21c, Generating and Displaying Execution Plans, DISPLAY_CURSOR +ALLSTATS example.
    const plan = parseOracleXplan(`|Id| Operation             | Name          |Start|E-Rows|A-Rows|A-Time|Buff|OMem|1Mem|O/1/M|
| 0| SELECT STATEMENT      |               |   1 |      | 269  |00:00:00.09|1338|    |    |     |
| 1|  NESTED LOOPS         |               |   1 |    1 | 269  |00:00:00.09|1338|    |    |     |
| 2|   MERGE JOIN CARTESIAN|               |   1 |    4 |9135  |00:00:00.03|  33|    |    |     |
|*3|    TABLE ACCESS FULL  |PRODUCT_INFORMAT|   1|    1 |  87  |00:00:00.01|  32|    |    |     |
| 4|    BUFFER SORT        |               |  87 |  105 |9135  |00:00:00.01|   1|4096|4096|1/0/0|
| 5|     INDEX FULL SCAN   | ORDER_PK      |   1 |  105 | 105  |00:00:00.01|   1|    |    |     |
|*6|   INDEX UNIQUE SCAN   | ORDER_ITEMS_UK|9135 |    1 | 269  |00:00:00.03|1305|    |    |     |
Predicate Information (identified by operation id):
   3 - filter(("MIN_PRICE"<40 AND "LIST_PRICE"<50))
   6 - access("O"."ORDER_ID"="ORDER_ID" AND "P"."PRODUCT_ID"="O"."PRODUCT_ID")`);
    expect(plan.kind).toBe("actual");
    expect(plan.nodes).toHaveLength(7);
    expect(plan.nodes[4]).toMatchObject({ operation: "BUFFER SORT", starts: 87, actualRows: 9135, buffers: 1 });
    expect(plan.nodes[6]).toMatchObject({ operation: "INDEX UNIQUE SCAN", starts: 9135, actualRows: 269, buffers: 1305 });
    expect(plan.root.children[0].children[0].children.map((node) => node.id)).toEqual([3, 4]);
    expect(plan.nodes[6].predicates[0]).toContain('access("O"."ORDER_ID"');
  });

  it("keeps missing runtime counters unavailable and accepts compact row suffixes", () => {
    const plan = parseOracleXplan(`| Id | Operation         | Name | Starts | E-Rows | A-Rows | Buffers | Reads |
|  0 | SELECT STATEMENT  |      |        |  1K    |        |         |       |
|  1 |  TABLE ACCESS FULL| T    |      2 |  1K    |     2K |      3K |    2M |`);
    expect(plan.root.actualRows).toBeUndefined();
    expect(plan.nodes[1]).toMatchObject({ estimatedRows: 1000, actualRows: 2000, buffers: 3000, reads: 2000000, starts: 2 });
  });

  it("rejects unrelated text, ambiguous IDs and oversized input", () => {
    expect(() => parseOracleXplan("SELECT * FROM users;")).toThrow();
    expect(() => parseOracleXplan("| Id | Operation |\n| 0 | SELECT |\n| 0 | TABLE ACCESS |" )).toThrow();
    expect(() => parseOracleXplan("x".repeat(2_000_001))).toThrow();
    expect(() => parseOracleXplan("| Id | Operation |\n| 0 | SELECT STATEMENT |\n| Id | Operation |\n| 0 | SELECT STATEMENT |")).toThrow(/Multiple/);
  });
});
