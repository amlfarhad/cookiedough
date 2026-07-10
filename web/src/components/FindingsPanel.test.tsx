import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reportCases } from "../data/report-cases";
import type { FindingSeverity } from "../types/audit";
import type { ScoreLensId } from "../lib/report-view";
import { AuditOverview } from "./AuditOverview";
import { FindingsPanel } from "./FindingsPanel";
import { ReadinessLenses } from "./ReadinessLenses";

const reportWithFindings = reportCases[1]!.report;
const emptyReport = reportCases[0]!.report;

afterEach(cleanup);

function FindingsHarness({ initial }: { readonly initial: ReadonlySet<FindingSeverity> }) {
  const [selectedSeverities, setSelectedSeverities] = useState(initial);

  return (
    <FindingsPanel
      findings={reportWithFindings.findings}
      selectedSeverities={selectedSeverities}
      onToggleSeverity={(severity) => {
        setSelectedSeverities((current) => {
          const next = new Set(current);
          if (next.has(severity)) next.delete(severity);
          else next.add(severity);
          return next;
        });
      }}
      onResetFilters={() => setSelectedSeverities(new Set(["blocker", "high", "medium", "low", "info"]))}
    />
  );
}

describe("ReadinessLenses", () => {
  it("activates focused lens buttons with Enter and Space", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn<(lens: ScoreLensId) => void>();

    render(<ReadinessLenses selectedLens="overall" scores={reportWithFindings.scores} onSelect={onSelect} />);

    const demoButton = screen.getByRole("button", { name: /demo 90/i });
    demoButton.focus();
    await user.keyboard("{Enter}");

    const launchButton = screen.getByRole("button", { name: /customer launch 90/i });
    launchButton.focus();
    await user.keyboard(" ");

    expect(onSelect).toHaveBeenNthCalledWith(1, "demo");
    expect(onSelect).toHaveBeenLastCalledWith("launch");
    expect(screen.getByRole("group", { name: "Readiness lens" })).toBeInTheDocument();
    expect(demoButton).toHaveAttribute("aria-pressed", "false");
  });
});

describe("AuditOverview", () => {
  it("renders the selected score alongside audit context", () => {
    render(<AuditOverview report={reportWithFindings} selectedLens="launch" />);

    expect(screen.getByText(reportWithFindings.target.url!)).toBeInTheDocument();
    expect(screen.getByText(reportWithFindings.run.mode)).toBeInTheDocument();
    expect(screen.getByText(reportWithFindings.run.supportLevel)).toBeInTheDocument();
    expect(screen.getByText("Customer launch")).toBeInTheDocument();
    expect(screen.getByTestId("selected-score")).toHaveTextContent(String(reportWithFindings.scores.customerLaunchReadiness));
    expect(screen.getByText(reportWithFindings.scores.verdict)).toBeInTheDocument();
  });
});

describe("FindingsPanel", () => {
  it("toggles severity filters through controlled state and keeps finding content in a disclosure", () => {
    render(<FindingsHarness initial={new Set(["medium"])} />);

    const mediumButton = screen.getByRole("button", { name: /medium: 1/i });
    expect(mediumButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(reportWithFindings.findings[0]!.title)).toBeInTheDocument();

    fireEvent.click(mediumButton);

    expect(mediumButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/No findings match the selected severities/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

    fireEvent.click(screen.getByText(reportWithFindings.findings[0]!.title));
    expect(screen.getByText(reportWithFindings.findings[0]!.id)).toBeInTheDocument();
    expect(screen.getByText(reportWithFindings.findings[0]!.description)).toBeInTheDocument();
    expect(screen.getByText("Recommendation").parentElement).toHaveTextContent(reportWithFindings.findings[0]!.recommendation);
    expect(screen.getByText(reportWithFindings.findings[0]!.evidence[0]!.message)).toBeInTheDocument();
  });

  it("shows the baked state when the original report has no findings", () => {
    render(
      <FindingsPanel
        findings={emptyReport.findings}
        selectedSeverities={new Set(["blocker", "high", "medium", "low", "info"])}
        onToggleSeverity={() => undefined}
        onResetFilters={() => undefined}
      />,
    );

    expect(screen.getByText(/No findings were recorded in this audit/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reset filters/i })).not.toBeInTheDocument();
  });

  it("shows a filtered-empty state and resets filters", () => {
    render(<FindingsHarness initial={new Set(["blocker"])} />);

    expect(screen.getByText(/No findings match the selected severities/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset filters/i })).toBeInTheDocument();
  });
});
