"use client";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { isActive } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import JobCard from "@/components/JobCard";

export default function JobsPage() {
  const { worker } = useAuth();
  const [jobs, setJobs] = useState(null);
  const [tab, setTab] = useState("active");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setJobs((await apiFetch("/api/jobs")).jobs);
    } catch (e) {
      setError(e.message);
      setJobs((j) => j ?? []);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = (jobs || []).filter(isActive);
  const done = (jobs || []).filter((j) => !isActive(j)).reverse();
  const list = tab === "active" ? active : done;
  const first = worker?.name?.split(" ")[0] || "there";

  return (
    <>
      <header className="top">
        <p className="hello">Hi {first}</p>
        <h1>My jobs</h1>
      </header>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "active"} className={tab === "active" ? "on" : ""} onClick={() => setTab("active")}>
          Active{jobs ? ` (${active.length})` : ""}
        </button>
        <button role="tab" aria-selected={tab === "done"} className={tab === "done" ? "on" : ""} onClick={() => setTab("done")}>
          Done{jobs ? ` (${done.length})` : ""}
        </button>
      </div>

      {error && (
        <div className="msg err">
          {error} <button className="link" onClick={load}>Try again</button>
        </div>
      )}

      {jobs === null ? (
        <div className="skeletons"><div /><div /><div /></div>
      ) : list.length === 0 ? (
        <div className="empty">
          <h3>{tab === "active" ? "No active jobs" : "Nothing finished yet"}</h3>
          <p>{tab === "active" ? "When the office assigns you a job it will show up here." : "Jobs you have returned or the office has closed appear here."}</p>
          <button className="btn ghost" onClick={load}>Refresh</button>
        </div>
      ) : (
        <div className="jobs">{list.map((j) => <JobCard key={j.id} job={j} />)}</div>
      )}
    </>
  );
}
