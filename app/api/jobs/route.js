import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyWorker } from "@/lib/verifyWorker";
import { toJob } from "@/lib/serializeWork";

// All jobs assigned to the signed-in worker.
// The admin stores staff as [{ id, name }], so we match that exact entry.
export async function GET(request) {
  const w = await verifyWorker(request);
  if (!w) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb
    .collection("works")
    .where("staff", "array-contains", { id: w.uid, name: w.name })
    .limit(200)
    .get();

  const jobs = snap.docs.map(toJob).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  return NextResponse.json({ jobs });
}
