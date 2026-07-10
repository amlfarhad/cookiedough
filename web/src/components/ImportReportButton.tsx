import { useId } from "react";
import { Upload } from "lucide-react";

interface ImportReportButtonProps {
  readonly busy: boolean;
  readonly onSelectFile: (file: File) => Promise<void>;
}

const visuallyHiddenInputStyle = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

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
        style={visuallyHiddenInputStyle}
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
