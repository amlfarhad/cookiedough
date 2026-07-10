export interface CaseOption {
  readonly id: string;
  readonly label: string;
  readonly sourceLabel: string;
}

interface CaseSelectorProps {
  readonly cases: readonly CaseOption[];
  readonly selectedId: string;
  readonly onChange: (id: string) => void;
}

export function CaseSelector({ cases, selectedId, onChange }: CaseSelectorProps) {
  return (
    <div className="case-selector">
      <label htmlFor="audit-case">Audit case</label>
      <select id="audit-case" value={selectedId} onChange={(event) => onChange(event.target.value)}>
        {cases.map((reportCase) => (
          <option key={reportCase.id} value={reportCase.id}>
            {reportCase.label}
          </option>
        ))}
      </select>
    </div>
  );
}
