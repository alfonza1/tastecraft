import { useId, useState, type CSSProperties } from "react";
import { tokens, type Values } from "./model";

export function SettingsPreview({
  values,
  label,
}: {
  values: Values;
  label: string;
}) {
  const id = useId();
  const [digest, setDigest] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [frequency, setFrequency] = useState("Daily");
  const [saved, setSaved] = useState(false);
  return (
    <section
      className="sample-surface settings-preview"
      style={tokens(values) as CSSProperties}
      aria-label={label}
    >
      <div className="settings-heading">
        <span>WORKSPACE / PREFERENCES</span>
        <h3>A little less noise.</h3>
        <p>Keep the updates that help you do your best work.</p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
        onChange={() => setSaved(false)}
      >
        <label className="setting-check">
          <input
            type="checkbox"
            checked={mentions}
            onChange={(event) => setMentions(event.target.checked)}
          />
          <span>
            <strong>Direct mentions</strong>
            <small>When someone needs your input.</small>
          </span>
        </label>
        <label className="setting-check">
          <input
            type="checkbox"
            checked={digest}
            onChange={(event) => setDigest(event.target.checked)}
          />
          <span>
            <strong>Project digest</strong>
            <small>The bigger picture, on your schedule.</small>
          </span>
        </label>
        <label htmlFor={`${id}-frequency`}>Digest frequency</label>
        <select
          id={`${id}-frequency`}
          disabled={!digest}
          value={frequency}
          onChange={(event) => setFrequency(event.target.value)}
        >
          <option>Daily</option>
          <option>Weekly</option>
        </select>
        <button type="submit">Save preferences</button>
        <p role="status" className="settings-result">
          {saved
            ? `Preview saved: ${digest ? frequency.toLowerCase() + " digest" : "digest off"}, mentions ${mentions ? "on" : "off"}.`
            : "Interactive example. These settings stay in this preview."}
        </p>
      </form>
    </section>
  );
}
