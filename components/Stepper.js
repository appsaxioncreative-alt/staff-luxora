import { STAGES, STAGE_LABEL } from "@/lib/format";

// Assigned -> Unloaded -> Returned. This one really is a sequence.
const VISIBLE = STAGES.filter((s) => s !== "delivered");

export default function Stepper({ stage }) {
  // Old jobs in "delivered" are treated as still waiting to be unloaded.
  const effective = stage === "delivered" ? "assigned" : stage;
  const cur = VISIBLE.indexOf(effective);

  return (
    <ol className="stepper" aria-label="Job progress">
      {VISIBLE.map((s, i) => (
        <li key={s} className={i < cur ? "done" : i === cur ? "current" : ""} aria-current={i === cur ? "step" : undefined}>
          <span className="dot">{i < cur || (i === cur && stage === "returned") ? "✓" : i + 1}</span>
          <span className="lbl">{STAGE_LABEL[s].replace(" to base", "")}</span>
        </li>
      ))}
    </ol>
  );
}