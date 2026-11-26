import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProvider } from "../app/AppProvider";
import { SqlServerShowplanPage } from "../features/explain-visualizer/SqlServerShowplanPage";

const xml = `<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan"><BatchSequence><Batch><Statements><StmtSimple StatementId="1" StatementType="SELECT"><QueryPlan DegreeOfParallelism="2"><RelOp NodeId="0" PhysicalOp="Nested Loops" EstimateRows="10"><NestedLoops><RelOp NodeId="1" PhysicalOp="Index Seek" EstimateRows="4"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="3" ActualExecutions="1"/></RunTimeInformation></RelOp></NestedLoops></RelOp></QueryPlan></StmtSimple></Statements></Batch></BatchSequence></ShowPlanXML>`;

describe("SQL Server plan page", () => {
  it("imports a plan, selects a child operator and separately imports IO/TIME messages", () => {
    render(<AppProvider><SqlServerShowplanPage /></AppProvider>);
    fireEvent.change(screen.getByLabelText(/paste Showplan XML/i), { target: { value: xml } });
    fireEvent.click(screen.getByRole("button", { name: /analyze plan/i }));
    expect(screen.getByText(/Degree of parallelism: 2/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/1 ↓/));
    fireEvent.click(screen.getByRole("button", { name: /Index Seek #1/ }));
    expect(screen.getByRole("region", { name: "Operator details" })).toHaveTextContent("Actual rows: 3");
    fireEvent.change(screen.getByLabelText("SQL Server Messages output"), { target: { value: "Table 'Orders'. Scan count 1, logical reads 76, physical reads 0.\nSQL Server Execution Times:\n CPU time = 2 ms, elapsed time = 5 ms." } });
    fireEvent.click(screen.getByRole("button", { name: "Import measurements" }));
    expect(screen.getByRole("cell", { name: "Orders" })).toBeInTheDocument();
    expect(screen.getByText(/Execution: CPU time 2 ms/)).toBeInTheDocument();
  });
  it("warns when comparing plans with different QueryHash values", async () => {
    render(<AppProvider><SqlServerShowplanPage /></AppProvider>);
    fireEvent.change(screen.getByLabelText(/paste Showplan XML/i), { target: { value: xml.replace('StatementId="1"', 'StatementId="1" QueryHash="0xAAAA"') } });
    fireEvent.click(screen.getByRole("button", { name: /analyze plan/i }));
    const other = xml.replace('StatementId="1"', 'StatementId="1" QueryHash="0xBBBB"');
    fireEvent.change(screen.getByLabelText("Second Showplan XML file"), { target: { files: [{ size: other.length, text: async () => other }] } });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Different QueryHash values"));
    expect(screen.getByRole("table")).toHaveTextContent("Root operator");
  });
});
