interface CoverageNotesProps {
  readonly notes: readonly string[];
}

export function CoverageNotes({ notes }: CoverageNotesProps) {
  return (
    <section className="coverage-notes" aria-labelledby="coverage-notes-title">
      <header className="coverage-notes__header">
        <p className="coverage-notes__eyebrow">Audit scope / execution record</p>
        <h2 id="coverage-notes-title">Coverage and execution notes</h2>
      </header>
      <ul>
        {notes.map((note, index) => (
          <li key={`${note}-${index}`}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
