import {
  Braces,
  FileJson,
  ListChecks,
  MonitorCheck,
  PackageSearch,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";

const stages = [
  {
    title: "Repo intake",
    detail: "Node web repositories and package scripts first, with the selected target recorded in the report.",
    Icon: PackageSearch,
  },
  {
    title: "Isolated command execution",
    detail: "Build and test commands run in Docker when available; unsupported execution is labeled instead of inferred.",
    Icon: TerminalSquare,
  },
  {
    title: "Browser evidence",
    detail: "Playwright records console, network, accessibility, and interaction evidence from the audited application.",
    Icon: MonitorCheck,
  },
  {
    title: "Deterministic findings and scoring",
    detail: "Evidence-backed rules produce repeatable findings and readiness scores from the same report inputs.",
    Icon: ListChecks,
  },
  {
    title: "Portable reports",
    detail: "JSON and HTML artifacts preserve findings, evidence, commands, support level, and run provenance.",
    Icon: FileJson,
  },
] as const;

export function ExecutionProof() {
  return (
    <section className="execution-proof section-band reveal reveal--2" aria-labelledby="execution-proof-title">
      <header className="section-heading">
        <p className="section-kicker">Execution model / 05 stages</p>
        <h2 id="execution-proof-title">From repository to portable evidence</h2>
        <p>Each stage leaves inspectable output. Coverage boundaries stay attached to the report.</p>
      </header>

      <ol className="execution-proof__stages">
        {stages.map(({ title, detail, Icon }, index) => (
          <li key={title}>
            <span className="execution-proof__index">{String(index + 1).padStart(2, "0")}</span>
            <Icon aria-hidden="true" strokeWidth={1.75} />
            <div>
              <h3>{title}</h3>
              <p>{detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="safety-boundary">
        <div className="safety-boundary__title">
          <ShieldCheck aria-hidden="true" strokeWidth={1.75} />
          <h3>Safety boundary</h3>
        </div>
        <p>
          Docker is preferred for repository execution. Credentials are single-run and redacted from artifacts. Payment
          and destructive actions are avoided. Unsupported execution is labeled in the report.
        </p>
        <Braces aria-hidden="true" strokeWidth={1.75} />
      </div>
    </section>
  );
}
