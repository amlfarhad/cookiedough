import { ExternalLink, FileCode2, Github, ShieldCheck } from "lucide-react";

const links = [
  { label: "Repository", href: "https://github.com/amlfarhad/cookiedough", Icon: Github },
  {
    label: "Architecture",
    href: "https://github.com/amlfarhad/cookiedough/blob/main/docs/architecture.md",
    Icon: FileCode2,
  },
  {
    label: "Safety model",
    href: "https://github.com/amlfarhad/cookiedough/blob/main/docs/safety.md",
    Icon: ShieldCheck,
  },
] as const;

export function RecruiterContext() {
  return (
    <section className="recruiter-context section-band reveal reveal--3" aria-labelledby="recruiter-context-title">
      <div className="recruiter-context__lead">
        <p className="section-kicker">Engineering context / current build</p>
        <h2 id="recruiter-context-title">Built by Amal Farhad</h2>
        <p className="recruiter-context__description">
          TypeScript product engineering across a CLI, Playwright browser evidence, Vitest verification, and explicit
          Docker execution boundaries.
        </p>
      </div>

      <dl className="recruiter-context__proof">
        <div>
          <dt>CLI verification</dt>
          <dd><strong>25 CLI tests</strong><span>Core audit and safety behavior</span></dd>
        </div>
        <div>
          <dt>Web verification</dt>
          <dd><strong>70 web tests</strong><span>Report viewer and import workflow</span></dd>
        </div>
      </dl>

      <nav className="recruiter-context__links" aria-label="Engineering documentation">
        {links.map(({ label, href, Icon }) => (
          <a key={label} href={href} rel="noreferrer">
            <Icon aria-hidden="true" strokeWidth={1.75} />
            <span>{label}</span>
            <ExternalLink className="recruiter-context__external-icon" aria-hidden="true" strokeWidth={1.75} />
          </a>
        ))}
      </nav>
    </section>
  );
}
