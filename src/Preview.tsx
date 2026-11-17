import { useState, type CSSProperties } from "react";
import { tokens, type Values } from "./model";

const INITIAL_TASKS = [
  "Find the right direction",
  "Make the details feel intentional",
  "Share something worth keeping",
];
export function Preview({
  values,
  label = "Design preview",
}: {
  values: Values;
  label?: string;
}) {
  const [done, setDone] = useState<number[]>([0]);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  return (
    <section
      className="sample"
      style={tokens(values) as CSSProperties}
      aria-label={label}
    >
      <div className="sample-top">
        <span className="sample-logo">a</span>
        <span>ATELIER / WORKSPACE</span>
        <span className="sample-avatar">JD</span>
      </div>
      <div className="sample-content">
        <div className="sample-eyebrow">
          <span className="sample-dot" /> PERSONAL PROJECT
        </div>
        <h3>
          A little more
          <br />
          like you.
        </h3>
        <p className="sample-description">
          A space for the work you care about.
          <br />
          Keep the useful things close.
        </p>
        <div className="sample-progress">
          <span>Creative direction</span>
          <strong>{done.length} / 3</strong>
        </div>
        <div className="sample-track">
          <span style={{ width: `${(done.length / 3) * 100}%` }} />
        </div>
        <div className="sample-tasks">
          {INITIAL_TASKS.map((task, index) => (
            <label
              key={task}
              className={
                done.includes(index) ? "sample-task is-done" : "sample-task"
              }
            >
              <input
                type="checkbox"
                checked={done.includes(index)}
                onChange={() =>
                  setDone((current) =>
                    current.includes(index)
                      ? current.filter((item) => item !== index)
                      : [...current, index],
                  )
                }
              />
              <span>{task}</span>
            </label>
          ))}
        </div>
        {notes.map((item, index) => (
          <p className="sample-note" key={index}>
            {item}
          </p>
        ))}
        {editing ? (
          <form
            className="sample-note-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (note.trim()) {
                setNotes((current) => [...current, note.trim()].slice(-3));
                setNote("");
                setEditing(false);
              }
            }}
          >
            <input
              aria-label="Note text"
              placeholder="Something worth remembering…"
              maxLength={120}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <button type="submit" disabled={!note.trim()}>
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <button className="sample-button" onClick={() => setEditing(true)}>
            + Add note
          </button>
        )}
        <div className="sample-footer">
          <span>Made with intention.</span>
          <span>↗</span>
        </div>
      </div>
    </section>
  );
}
