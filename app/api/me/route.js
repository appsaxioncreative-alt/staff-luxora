import { NextResponse } from "next/server";
import { verifyWorker } from "@/lib/verifyWorker";

const publicWorker = (w) => ({
  id: w.uid,
  name: w.name,
  email: w.email,
  phone: w.phone,
  joined: w.createdAt?.toDate ? w.createdAt.toDate().toISOString() : null,
});

export async function GET(request) {
  const w = await verifyWorker(request);
  if (!w) return NextResponse.json({ error: "This account is not set up as a worker. Ask the admin to add you." }, { status: 403 });
  return NextResponse.json({ worker: publicWorker(w) });
}

// Workers can only change their phone number. Their name must stay as the admin
// entered it, because assigned jobs are matched by it.
export async function PATCH(request) {
  const w = await verifyWorker(request);
  if (!w) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone } = await request.json();
  const clean = String(phone ?? "").trim();
  if (clean && !/^\+?[\d\s-]{7,18}$/.test(clean)) {
    return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
  }
  await w.ref.update({ phone: clean });
  return NextResponse.json({ worker: publicWorker({ ...w, phone: clean }) });
}
