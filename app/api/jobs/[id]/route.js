import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyWorker } from "@/lib/verifyWorker";
import { toJob } from "@/lib/serializeWork";

const isCount = (n) => Number.isInteger(n) && n >= 0;

export async function GET(request, { params }) {
  const w = await verifyWorker(request);
  if (!w) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const snap = await adminDb.collection("works").doc(id).get();
  if (!snap.exists || !(snap.data().staff || []).some((s) => s.id === w.uid)) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json({ job: toJob(snap) });
}

// Move a job through the field steps:
//   assigned -> deliver -> delivered -> unload -> unloaded -> return -> returned
// Steps can't be skipped or repeated, and nothing changes once the admin closes the work.
export async function PATCH(request, { params }) {
  const w = await verifyWorker(request);
  if (!w) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { action, counts } = await request.json();

  const ref = adminDb.collection("works").doc(id);
  const by = { id: w.uid, name: w.name };

  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const work = snap.data();
      if (!snap.exists || !(work.staff || []).some((s) => s.id === w.uid)) throw new Error("Job not found");
      if (work.status !== "ongoing") throw new Error("The office has already closed this job");
      const stage = work.fieldStage || "assigned";

      if (action === "deliver") {
        if (stage !== "assigned") throw new Error("This job is already marked as delivered");
        tx.update(ref, { fieldStage: "delivered", "fieldLog.delivered": { at: new Date(), by } });
        return;
      }

      if (action === "unload") {
        if (stage !== "delivered") throw new Error(stage === "assigned" ? "Mark the job as delivered first" : "This job is already unloaded");
        tx.update(ref, { fieldStage: "unloaded", "fieldLog.unloaded": { at: new Date(), by } });
        return;
      }

      if (action === "return") {
        if (stage !== "unloaded") throw new Error(stage === "returned" ? "Return counts were already submitted" : "Unload the items before submitting return counts");

        const given = new Map((counts || []).map((c) => [c.itemId, c]));
        const items = (work.items || []).map((it) => {
          const c = given.get(it.itemId);
          if (!c) throw new Error(`Enter the returned count for "${it.name}"`);
          const returned = Number(c.returned);
          const broken = Number(c.broken || 0);
          const missing = Number(c.missing || 0);
          const note = String(c.note || "").trim();

          if (!isCount(returned) || !isCount(broken) || !isCount(missing)) throw new Error(`Counts for "${it.name}" must be whole numbers`);
          if (returned > it.quantity) throw new Error(`"${it.name}": returned count is more than the ${it.quantity} assigned`);

          const short = it.quantity - returned;
          if (broken + missing !== short) throw new Error(`"${it.name}": broken + missing must equal the ${short} short`);
          if (short > 0 && note.length < 3) throw new Error(`"${it.name}": add a short explanation`);

          return { itemId: it.itemId, name: it.name, assigned: it.quantity, returned, broken, missing, note: short > 0 ? note : "" };
        });

        tx.update(ref, {
          fieldStage: "returned",
          "fieldLog.returned": { at: new Date(), by },
          returnReport: {
            items,
            hasDifference: items.some((i) => i.returned !== i.assigned),
            submittedAt: new Date(),
            submittedBy: by,
          },
        });
        return;
      }

      throw new Error("Unknown action");
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const fresh = await ref.get();
  return NextResponse.json({ job: toJob(fresh) });
}
