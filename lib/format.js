export const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—";

export const STAGES = ["assigned", "delivered", "unloaded", "returned"];
export const STAGE_LABEL = {
  assigned: "Assigned",
  delivered: "Delivered",
  unloaded: "Unloaded",
  returned: "Returned to base",
};
export const stageIndex = (s) => Math.max(0, STAGES.indexOf(s));

// What to show on a card/pill: the admin closing a job wins over the field stage.
export function jobBadge(job) {
  if (job.status === "completed") return { key: "completed", label: "Closed" };
  if (job.status === "cancelled") return { key: "cancelled", label: "Cancelled" };
  return { key: job.fieldStage, label: STAGE_LABEL[job.fieldStage] };
}

export const isActive = (job) => job.status === "ongoing" && job.fieldStage !== "returned";
