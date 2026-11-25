import { NextResponse } from "next/server";
import { verifyWorker } from "@/lib/verifyWorker";

const publicWorker = (w) => ({
  id: w.uid,
  name: w.name,
  email: w.email,
  phone: w.phone,
  photo: w.photo || "",
  joined: w.createdAt?.toDate ? w.createdAt.toDate().toISOString() : null,
});

export async function GET(request) {
  const w = await verifyWorker(request);
  if (!w) return NextResponse.json({ error: "This account is not set up as a worker. Ask the admin to add you." }, { status: 403 });
  return NextResponse.json({ worker: publicWorker(w) });
}

// Workers can change their name, phone number and profile photo.
export async function PATCH(request) {
  const w = await verifyWorker(request);
  if (!w) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const update = {};

  if (body.name !== undefined) {
    const name = String(body.name ?? "").trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json({ error: "Name must be 2 to 50 characters" }, { status: 400 });
    }
    update.name = name;
  }

  if (body.phone !== undefined) {
    const clean = String(body.phone ?? "").trim();
    if (clean && !/^\+?[\d\s-]{7,18}$/.test(clean)) {
      return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
    }
    update.phone = clean;
  }

  if (body.photoUrl !== undefined) {
    const url = String(body.photoUrl || "").trim();
    // "" removes the photo. Otherwise it must be this worker's own Cloudinary upload.
    const allowed = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`;
    if (url && !(url.startsWith(allowed) && url.includes(`/workers/${w.uid}`))) {
      return NextResponse.json({ error: "Invalid photo" }, { status: 400 });
    }
    update.photo = url;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await w.ref.update(update);
  return NextResponse.json({ worker: publicWorker({ ...w, ...update }) });
}