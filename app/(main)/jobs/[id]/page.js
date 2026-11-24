"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { fmt, jobBadge } from "@/lib/format";
import Stepper from "@/components/Stepper";
import ConfirmSheet from "@/components/ConfirmSheet";
import ReturnForm from "@/components/ReturnForm";
import ReportView from "@/components/ReportView";

const maps = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export default function JobPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // "deliver" | "unload"

  const load = useCallback(async () => {
    try {
      setJob((await apiFetch(`/api/jobs/${id}`)).job);
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function act(action, counts) {
    setBusy(true);
    setError("");
    try {
      const d = await apiFetch(`/api/jobs/${id}`, { method: "PATCH", body: JSON.stringify({ action, counts }) });
      setJob(d.job);
      setConfirm(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
      setConfirm(null);
      load(); // someone else on the crew may have moved it already
    }
    setBusy(false);
  }

  if (!job) {
    return (
      <>
        <Link href="/jobs" className="back">‹ My jobs</Link>
        {error ? <div className="msg err">{error}</div> : <div className="skeletons"><div /><div /></div>}
      </>
    );
  }

  const badge = jobBadge(job);
  const closed = job.status !== "ongoing";
  const stage = job.fieldStage;
  const units = job.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <>
      <Link href="/jobs" className="back">‹ My jobs</Link>

      <header className="job-head">
        <div className="job-top">
          <h1>{job.name}</h1>
          <span className={`pill ${badge.key}`}>{badge.label}</span>
        </div>
        <p className="muted">{job.venueType}</p>
      </header>

      <Stepper stage={stage} />

      {closed && (
        <div className="msg warn">
          The office has {job.status === "cancelled" ? "cancelled" : "closed"} this job. It is read-only.
        </div>
      )}
      {error && <div className="msg err" role="alert">{error}</div>}

      {/* ---------- what to do next ---------- */}
      {!closed && stage === "assigned" && (
        <section className="card action">
          <h2>Next: deliver</h2>
          <p>Tap when the items have reached the venue.</p>
          <button className="btn" onClick={() => setConfirm("deliver")}>Mark as delivered</button>
        </section>
      )}
      {!closed && stage === "delivered" && (
        <section className="card action">
          <h2>Next: unload</h2>
          <p>Tap when everything is unloaded at the venue.</p>
          <button className="btn" onClick={() => setConfirm("unload")}>Mark as unloaded</button>
        </section>
      )}
      {!closed && stage === "unloaded" && (
        <section className="card">
          <h2>Return counts</h2>
          <ReturnForm items={job.items} busy={busy} onSubmit={(counts) => act("return", counts)} />
        </section>
      )}
      {stage === "returned" && (
        <section className="card">
          <h2>Return report</h2>
          <ReportView report={job.returnReport} />
        </section>
      )}

      {/* ---------- job details ---------- */}
      <section className="card">
        <h2>Details</h2>
        <dl className="details">
          <div><dt>When</dt><dd>{fmt(job.startAt)}</dd></div>
          <div><dt>Where</dt><dd>{job.location} <a className="inline" href={maps(job.location)} target="_blank" rel="noreferrer">Open map</a></dd></div>
          {(job.contactName || job.contactPhone) && (
            <div>
              <dt>Contact</dt>
              <dd>
                {job.contactName}{" "}
                {job.contactPhone && <a className="inline" href={`tel:${job.contactPhone.replace(/\s/g, "")}`}>{job.contactPhone}</a>}
              </dd>
            </div>
          )}
          {job.vehicles.length > 0 && (
            <div><dt>Vehicles</dt><dd>{job.vehicles.map((v) => `${v.name} (${v.number})`).join(", ")}</dd></div>
          )}
          <div><dt>Crew</dt><dd>{job.staff.map((s) => s.name).join(", ") || "—"}</dd></div>
        </dl>
      </section>

      {stage !== "returned" && (
        <section className="card">
          <h2>Items to carry <span className="muted">({units} units)</span></h2>
          <ul className="rows plain">
            {job.items.map((i) => (
              <li key={i.itemId} className="row">
                <div className="row-main"><span className="row-name">{i.name}</span><span className="num">{i.quantity}</span></div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- history ---------- */}
      {(job.fieldLog.delivered || job.fieldLog.unloaded || job.fieldLog.returned) && (
        <section className="card">
          <h2>History</h2>
          <ul className="history">
            {[["Delivered", job.fieldLog.delivered], ["Unloaded", job.fieldLog.unloaded], ["Returned to base", job.fieldLog.returned]]
              .filter(([, e]) => e)
              .map(([label, e]) => (
                <li key={label}><strong>{label}</strong><span>{fmt(e.at)} by {e.by?.name}</span></li>
              ))}
          </ul>
        </section>
      )}

      {confirm === "deliver" && (
        <ConfirmSheet title="Mark as delivered?" confirmLabel="Yes, delivered" busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => act("deliver")}>
          <p>This tells the office “{job.name}” has reached the venue.</p>
        </ConfirmSheet>
      )}
      {confirm === "unload" && (
        <ConfirmSheet title="Mark as unloaded?" confirmLabel="Yes, unloaded" busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => act("unload")}>
          <p>Everything has been taken off the vehicle at the venue.</p>
        </ConfirmSheet>
      )}
    </>
  );
}
