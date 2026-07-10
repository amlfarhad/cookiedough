import type { ReactNode } from "react";
import { Github } from "lucide-react";

interface ProductBarProps {
  readonly children?: ReactNode;
}

export function ProductBar({ children }: ProductBarProps) {
  return (
    <header className="product-bar">
      <div>
        <h1>CookieDough</h1>
        <p>Evidence-first readiness auditor</p>
      </div>
      <nav aria-label="Product links">
        <a href="https://github.com/amlfarhad" rel="noreferrer">
          Built by Amal Farhad
        </a>
        <a href="https://github.com/amlfarhad/cookiedough" rel="noreferrer">
          <Github aria-hidden="true" strokeWidth={1.75} />
          <span>View CookieDough on GitHub</span>
        </a>
        {children}
      </nav>
    </header>
  );
}
