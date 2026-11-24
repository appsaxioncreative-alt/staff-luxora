import Link from "next/link";
import { fmt, jobBadge } from "@/lib/format";

export default function JobCard({ job }) {
  const badge = jobBadge(job);
  const units = job.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <Link href={`/jobs/${job.id}`} className="job">
      <div className="job-top">
        <h3>{job.name}</h3>
        <span className={`pill ${badge.key}`}>{badge.label}</span>
      </div>
      <p className="job-when">{fmt(job.startAt)}</p>
      <p className="job-where">{job.location}</p>
      <p className="job-meta">
        {job.items.length} {job.items.length === 1 ? "item" : "items"} ({units} units)
        {job.vehicles.length > 0 && <> — {job.vehicles.map((v) => v.number).join(", ")}</>}
      </p>
    </Link>
  );
}
