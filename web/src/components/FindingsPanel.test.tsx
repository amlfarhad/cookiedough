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

function ReadinessHarness({ onSelect }: { readonly onSelect: (lens: ScoreLensId) => void }) {
  const [selectedLens, setSelectedLens] = useState<ScoreLensId>("overall");

  return (
    <ReadinessLenses
      selectedLens={selectedLens}
      scores={reportWithFindings.scores}
      onSelect={(lens) => {
        onSelect(lens);
        setSelectedLens(lens);
      }}
    />
  );
}

describe("ReadinessLenses", () => {
  it("activates focused lens buttons with Enter and Space", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn<(lens: ScoreLensId) => void>();

    render(<ReadinessHarness onSelect={onSelect} />);

    const demoButton = screen.getByRole("button", { name: /demo 90/i });
    demoButton.focus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenNthCalledWith(1, "demo");
    expect(demoButton).toHaveAttribute("aria-pressed", "true");

    const launchButton = screen.getByRole("button", { name: /customer launch 90/i });
    launchButton.focus();
    await user.keyboard(" ");

    expect(onSelect).toHaveBeenLastCalledWith("launch");
    expect(demoButton).toHaveAttribute("aria-pressed", "false");
    expect(launchButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("group", { name: "Readiness lens" })).toBeInTheDocument();
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

  it("shows a date fallback for an invalid run timestamp", () => {
    render(
      <AuditOverview
        report={{ ...reportWithFindings, run: { ...reportWithFindings.run, startedAt: "not-a-date" } }}
        selectedLens="overall"
      />,
    );

    expect(screen.getByText("Date unavailable")).toBeInTheDocument();
  });
});

describe("FindingsPanel", () => {
  it("toggles severity filters through controlled state and keeps finding content in a disclosure", () => {
    render(<FindingsHarness initial={new Set(["medium"])} />);

    const mediumButton = screen.getByRole("button", { name: /medium: 1/i });
    expect(mediumButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(reportWithFindings.findings[0]!.title)).toBeInTheDocument();
    expect(screen.getByText("1 finding shown")).toHaveAttribute("aria-live", "polite");

    fireEvent.click(mediumButton);

    expect(mediumButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/No findings match the selected severities/i)).toBeInTheDocument();
    expect(screen.getByText("0 findings shown")).toHaveAttribute("aria-live", "polite");

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

  it("renders duplicate finding IDs without a React duplicate-key warning", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const duplicatedFindings = [
      reportWithFindings.findings[0]!,
      { ...reportWithFindings.findings[0]!, title: "Repeated imported finding" },
    ];

    render(
      <FindingsPanel
        findings={duplicatedFindings}
        selectedSeverities={new Set(["medium"])}
        onToggleSeverity={() => undefined}
        onResetFilters={() => undefined}
      />,
    );

    expect(screen.getByText("Repeated imported finding")).toBeInTheDocument();
    expect(consoleError.mock.calls.some(([message]) => String(message).includes("same key"))).toBe(false);
  });
});
