import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider } from "../app/AppProvider";
import { OracleXplanPage } from "../features/explain-visualizer/OracleXplanPage";

afterEach(() => window.localStorage.clear());

describe("Oracle DBMS_XPLAN UI", () => {
  it("imports a documented sample and navigates to the selected operator", () => {
    window.localStorage.setItem("sql-atlas.language", "en");
    render(<AppProvider><OracleXplanPage /></AppProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Load sample" }));
    fireEvent.click(screen.getByRole("button", { name: /1 · TABLE ACCESS FULL/ }));
    expect(screen.getByText(/Operator details: TABLE ACCESS FULL/)).toBeInTheDocument();
    expect(screen.getByText("cardinality feedback used for this statement")).toBeInTheDocument();
    expect(screen.getAllByText(/filter\(\("CUST_STATE_PROVINCE"/).some((element) => element.tagName === "PRE")).toBe(true);
  });

  it("explains invalid input in Polish without keeping stale results", () => {
    window.localStorage.setItem("sql-atlas.language", "pl");
    render(<AppProvider><OracleXplanPage /></AppProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Wczytaj przykład" }));
    fireEvent.change(screen.getByLabelText(/Lub wklej PLAN_TABLE_OUTPUT/), { target: { value: "not a plan" } });
    fireEvent.click(screen.getByRole("button", { name: /Analizuj plan/ }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Nie udało się odczytać/);
    expect(screen.queryByText(/cardinality feedback used/)).not.toBeInTheDocument();
  });
});
