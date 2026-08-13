import { describe, expect, it } from "vitest";
import { parseCreateTableSchema } from "../core/schema/parseCreateTable";

describe("CREATE TABLE schema parser", () => {
  it("parses columns, primary keys, and inline foreign keys", () => {
    const schema = parseCreateTableSchema(`
      CREATE TABLE customers (
        id bigint PRIMARY KEY,
        email varchar(255) NOT NULL UNIQUE
      );
      CREATE TABLE orders (
        id bigint PRIMARY KEY,
        customer_id bigint NOT NULL REFERENCES customers(id),
        total numeric(12, 2) NOT NULL
      );
    `);

    expect(schema.tables).toHaveLength(2);
    expect(schema.tables[0].columns[0]).toMatchObject({
      name: "id",
      dataType: "bigint",
      primaryKey: true,
    });
    expect(schema.tables[0].columns[1]).toMatchObject({
      nullable: false,
      unique: true,
    });
    expect(schema.foreignKeys[0]).toMatchObject({
      sourceTable: "orders",
      sourceColumns: ["customer_id"],
      targetTable: "customers",
      targetColumns: ["id"],
      resolved: true,
    });
  });

  it("supports named table constraints and composite primary keys", () => {
    const schema = parseCreateTableSchema(`
      CREATE TABLE public.products (id uuid PRIMARY KEY);
      CREATE TABLE public.order_items (
        order_id bigint NOT NULL,
        product_id uuid NOT NULL,
        PRIMARY KEY (order_id, product_id),
        CONSTRAINT item_product_fk
          FOREIGN KEY (product_id) REFERENCES public.products(id)
      );
    `);

    const orderItems = schema.tables.find(
      (table) => table.name === "public.order_items",
    );
    expect(orderItems?.columns.filter((column) => column.primaryKey)).toHaveLength(2);
    expect(schema.foreignKeys[0].resolved).toBe(true);
  });

  it("reports missing referenced tables and input without DDL", () => {
    const unresolved = parseCreateTableSchema(`
      CREATE TABLE events (
        user_id bigint REFERENCES users(id)
      );
    `);
    expect(unresolved.foreignKeys[0].resolved).toBe(false);
    expect(unresolved.warnings).toContainEqual({
      code: "missing-reference",
      table: "users",
    });

    const empty = parseCreateTableSchema("SELECT 1;");
    expect(empty.tables).toHaveLength(0);
    expect(empty.warnings[0]).toEqual({ code: "no-create-table" });
  });
});
