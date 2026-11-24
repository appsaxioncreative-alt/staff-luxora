import { STAGES, STAGE_LABEL, stageIndex } from "@/lib/format";

// Assigned -> Delivered -> Unloaded -> Returned. This one really is a sequence.
export default function Stepper({ stage }) {
  const cur = stageIndex(stage);
  return (
    <ol className="stepper" aria-label="Job progress">
      {STAGES.map((s, i) => (
        <li key={s} className={i < cur ? "done" : i === cur ? "current" : ""} aria-current={i === cur ? "step" : undefined}>
          <span className="dot">{i < cur || (i === cur && stage === "returned") ? "✓" : i + 1}</span>
          <span className="lbl">{STAGE_LABEL[s].replace(" to base", "")}</span>
        </li>
      ))}
    </ol>
  );
}
