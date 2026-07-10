import { useEffect, useRef, useState } from "react";
import { AuditOverview } from "./components/AuditOverview";
import { CaseSelector } from "./components/CaseSelector";
import { CopyCommandButton } from "./components/CopyCommandButton";
import { ExecutionProof } from "./components/ExecutionProof";
import { FindingsPanel } from "./components/FindingsPanel";
import { ImportReportButton } from "./components/ImportReportButton";
import { ProductBar } from "./components/ProductBar";
import { ReadinessLenses } from "./components/ReadinessLenses";
import { RecruiterContext } from "./components/RecruiterContext";
import { defaultReportCaseId, reportCases } from "./data/report-cases";
import { ReportImportError, parseAuditFile } from "./lib/report-schema";
import { severityOrder } from "./lib/report-view";
import type { ScoreLensId } from "./lib/report-view";
import type { AuditResult, FindingSeverity } from "./types/audit";

const allSeverities = () => new Set<FindingSeverity>(severityOrder);
type DisplayReport = (typeof reportCases)[number]["report"];

function importErrorMessage(error: unknown): string {
  if (error instanceof ReportImportError) {
    switch (error.code) {
      case "file-too-large":
        return "The selected report is larger than 2 MB.";
      case "invalid-json":
        return "The selected file is not valid JSON.";
      case "invalid-report":
        return "The selected JSON is not a compatible CookieDough report.";
    }
  }

  return "We could not read that file. Please try again.";
}

export default function App() {
  const defaultCase = reportCases.find((reportCase) => reportCase.id === defaultReportCaseId)!;
  const [activeCaseId, setActiveCaseId] = useState<string>(defaultReportCaseId);
  const [activeReport, setActiveReport] = useState<DisplayReport>(defaultCase.report);
  const [importedReport, setImportedReport] = useState<AuditResult | null>(null);
  const [selectedLens, setSelectedLens] = useState<ScoreLensId>("overall");
  const [selectedSeverities, setSelectedSeverities] = useState<Set<FindingSeverity>>(allSeverities);
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const importRequestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      importRequestRef.current += 1;
    };
  }, []);

  const cases = [
    ...reportCases,
    ...(importedReport
      ? [
          {
            id: "imported",
            label: "Imported report",
            eyebrow: "Local report",
            description: "A report loaded only in this browser tab.",
            sourceLabel: "Private browser import",
            command: "Imported from a local JSON file",
            report: importedReport,
          },
        ]
      : []),
  ];
  const activeCase = cases.find((reportCase) => reportCase.id === activeCaseId)!;

  const resetReportControls = () => {
    setSelectedLens("overall");
    setSelectedSeverities(allSeverities());
  };

  const selectCase = (id: string) => {
    const selectedCase = cases.find((reportCase) => reportCase.id === id);
    if (!selectedCase) return;

    setActiveCaseId(selectedCase.id);
    setActiveReport(selectedCase.report);
    setImportError(null);
    setImportStatus(null);
    setCopyFeedback(null);
    resetReportControls();
  };

  const importReport = async (file: File) => {
    const requestId = importRequestRef.current + 1;
    importRequestRef.current = requestId;
    setImportBusy(true);
    setImportError(null);
    setImportStatus("Importing report");
    setCopyFeedback(null);

    try {
      const report = await parseAuditFile(file);
      if (!mountedRef.current || importRequestRef.current !== requestId) return;

      setImportedReport(report);
      setActiveCaseId("imported");
      setActiveReport(report);
      resetReportControls();
      setImportStatus("Imported report");
    } catch (error) {
      if (!mountedRef.current || importRequestRef.current !== requestId) return;

      setImportStatus(null);
      setImportError(importErrorMessage(error));
    } finally {
      if (mountedRef.current && importRequestRef.current === requestId) {
        setImportBusy(false);
      }
    }
  };

  const showCopyFeedback = (message: string) => {
    setImportError(null);
    setImportStatus(null);
    setCopyFeedback(message);
  };

  return (
    <>
      <a className="skip-link" href="#audit-workspace">Skip to audit workspace</a>
      <div className="app-shell">
        <ProductBar>
          <ImportReportButton busy={importBusy} onSelectFile={importReport} />
        </ProductBar>

        <div className="feedback-rail" aria-live="polite">
          {importError ? <p className="feedback feedback--error" role="alert">{importError}</p> : null}
          {importStatus ? <p className="feedback" role="status" aria-label="Import feedback">{importStatus}</p> : null}
          {copyFeedback ? <p className="feedback" role="status" aria-label="Copy feedback">{copyFeedback}</p> : null}
        </div>

        <main id="audit-workspace" className="workspace reveal reveal--1">
          <section className="case-strip" aria-label="Audit controls">
            <CaseSelector cases={cases} selectedId={activeCaseId} onChange={selectCase} />
            <div className="case-strip__provenance">
              <span>{activeCase.eyebrow}</span>
              <strong>{activeCase.sourceLabel}</strong>
            </div>
            <p>{activeCase.description}</p>
          </section>

          <div className="workspace__overview">
            <AuditOverview report={activeReport} selectedLens={selectedLens} />
            <div className="workspace__lenses">
              <p className="control-label">Readiness lens</p>
              <ReadinessLenses selectedLens={selectedLens} scores={activeReport.scores} onSelect={setSelectedLens} />
            </div>
          </div>

          <section className="command-strip" aria-label="Command and provenance">
            <div className="command-strip__label">
              <span>Execution provenance</span>
              <strong>Reproduce this evidence</strong>
            </div>
            <CopyCommandButton command={activeCase.command} onFeedback={showCopyFeedback} />
          </section>

          <FindingsPanel
            findings={activeReport.findings}
            selectedSeverities={selectedSeverities}
            onToggleSeverity={(severity) => {
              setSelectedSeverities((current) => {
                const next = new Set(current);
                if (next.has(severity)) next.delete(severity);
                else next.add(severity);
                return next;
              });
            }}
            onResetFilters={() => setSelectedSeverities(allSeverities())}
          />

          <ExecutionProof />
          <RecruiterContext />
        </main>

        <footer className="site-footer">
          <strong>Viewer, not scanner.</strong>
          <p>This hosted page is a report viewer. CookieDough audits run through the CLI, then produce portable reports for inspection here.</p>
        </footer>
      </div>
    </>
  );
}
