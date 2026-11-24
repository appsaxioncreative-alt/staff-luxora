"use client";

// Bottom sheet that asks "are you sure?" before a step that can't be undone.
export default function ConfirmSheet({ title, children, confirmLabel, busy, onConfirm, onCancel }) {
  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet-backdrop" onClick={busy ? undefined : onCancel} />
      <div className="sheet">
        <h3>{title}</h3>
        <div className="sheet-body">{children}</div>
        <div className="sheet-actions">
          <button className="btn ghost" onClick={onCancel} disabled={busy}>Go back</button>
          <button className="btn" onClick={onConfirm} disabled={busy}>{busy ? "Saving…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
