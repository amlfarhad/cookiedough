import { useId } from "react";
import { Upload } from "lucide-react";

interface ImportReportButtonProps {
  readonly busy: boolean;
  readonly onSelectFile: (file: File) => Promise<void>;
}

export function ImportReportButton({ busy, onSelectFile }: ImportReportButtonProps) {
  const inputId = useId();

  return (
    <div className="import-report-button" aria-busy={busy}>
      <label htmlFor={inputId} aria-disabled={busy}>
        <Upload aria-hidden="true" strokeWidth={1.75} />
        <span>{busy ? "Importing report" : "Import report"}</span>
      </label>
      <input
        id={inputId}
        className="import-report-button__input"
        type="file"
        accept=".json,application/json"
        disabled={busy}
        onChange={async (event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];

          if (!file) return;

          try {
            await onSelectFile(file);
          } finally {
            input.value = "";
          }
        }}
      />
    </div>
  );
}
