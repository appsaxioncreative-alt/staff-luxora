"use client";
import { useMemo, useState } from "react";
import ConfirmSheet from "./ConfirmSheet";

const parse = (v) => (/^\d+$/.test(String(v).trim()) ? Number(v) : null);

// For every assigned item the worker types how many came back.
// If it is fewer than assigned, they must split the difference into broken / missing
// and write a short explanation. Nothing can be submitted until every row is valid.
export default function ReturnForm({ items, busy, onSubmit }) {
  const [rows, setRows] = useState(() =>
    Object.fromEntries(items.map((i) => [i.itemId, { returned: "", broken: "", missing: "", note: "" }]))
  );
  const [confirming, setConfirming] = useState(false);
  const [touched, setTouched] = useState(false);

  const set = (id, patch) => setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));

  const checked = useMemo(
    () =>
      items.map((it) => {
        const r = rows[it.itemId];
        const returned = parse(r.returned);
        const short = returned === null ? 0 : it.quantity - returned;
        let error = "";
        if (returned === null) error = "Enter how many came back";
        else if (returned > it.quantity) error = `More than the ${it.quantity} assigned`;
        else if (short > 0) {
          const b = r.broken === "" ? 0 : parse(r.broken);
          const m = r.missing === "" ? 0 : parse(r.missing);
          if (b === null || m === null) error = "Broken and missing must be whole numbers";
          else if (b + m !== short) error = `Broken + missing must add up to ${short}`;
          else if (r.note.trim().length < 3) error = "Add a short explanation";
        }
        return { it, r, returned, short, error };
      }),
    [items, rows]
  );

  const allValid = checked.every((c) => c.error === "");
  const withDiff = checked.filter((c) => c.short > 0);

  function submit() {
    onSubmit(
      checked.map(({ it, r, returned, short }) => ({
        itemId: it.itemId,
        returned,
        broken: short > 0 ? Number(r.broken || 0) : 0,
        missing: short > 0 ? Number(r.missing || 0) : 0,
        note: short > 0 ? r.note.trim() : "",
      }))
    );
  }

  return (
    <div className="return-form">
      <p className="help">Count each item as it comes back to base and type the number. If something is short, say whether it is broken or missing.</p>

      <ul className="rows">
        {checked.map(({ it, r, returned, short, error }) => (
          <li key={it.itemId} className={`row ${short > 0 ? "short" : ""} ${touched && error ? "invalid" : ""}`}>
            <div className="row-main">
              <label htmlFor={`c-${it.itemId}`} className="row-name">{it.name}</label>
              <span className="assigned">of {it.quantity}</span>
              <input
                id={`c-${it.itemId}`}
                className="count"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={r.returned}
                onChange={(e) => set(it.itemId, { returned: e.target.value.replace(/\D/g, "") })}
                aria-invalid={touched && !!error}
              />
            </div>

            {short > 0 && (
              <div className="diff">
                <p className="diff-title">{short} short. Where did {short === 1 ? "it" : "they"} go?</p>
                <div className="chips">
                  <button type="button" onClick={() => set(it.itemId, { broken: String(short), missing: "0" })}>All broken</button>
                  <button type="button" onClick={() => set(it.itemId, { broken: "0", missing: String(short) })}>All missing</button>
                </div>
                <div className="two">
                  <div className="field">
                    <label htmlFor={`b-${it.itemId}`}>Broken</label>
                    <input id={`b-${it.itemId}`} inputMode="numeric" placeholder="0" value={r.broken} onChange={(e) => set(it.itemId, { broken: e.target.value.replace(/\D/g, "") })} />
                  </div>
                  <div className="field">
                    <label htmlFor={`m-${it.itemId}`}>Missing</label>
                    <input id={`m-${it.itemId}`} inputMode="numeric" placeholder="0" value={r.missing} onChange={(e) => set(it.itemId, { missing: e.target.value.replace(/\D/g, "") })} />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor={`n-${it.itemId}`}>Explanation</label>
                  <textarea id={`n-${it.itemId}`} rows={2} maxLength={300} placeholder="What happened? For example: dropped while unloading, left at the venue" value={r.note} onChange={(e) => set(it.itemId, { note: e.target.value })} />
                </div>
              </div>
            )}

            {touched && error && <p className="row-error" role="alert">{error}</p>}
          </li>
        ))}
      </ul>

      <button
        className="btn"
        onClick={() => (allValid ? setConfirming(true) : setTouched(true))}
        disabled={busy}
      >
        Submit return counts
      </button>
      {touched && !allValid && <p className="msg err">Fix the highlighted items first.</p>}

      {confirming && (
        <ConfirmSheet
          title="Submit return counts?"
          confirmLabel="Submit"
          busy={busy}
          onCancel={() => setConfirming(false)}
          onConfirm={submit}
        >
          {withDiff.length === 0 ? (
            <p>All {items.length} items came back in full. You can’t change this after submitting.</p>
          ) : (
            <>
              <p>{withDiff.length} {withDiff.length === 1 ? "item has" : "items have"} a difference. The office will see it. You can’t change this after submitting.</p>
              <ul className="mini">
                {withDiff.map(({ it, short }) => <li key={it.itemId}>{it.name}: {short} short</li>)}
              </ul>
            </>
          )}
        </ConfirmSheet>
      )}
    </div>
  );
}
