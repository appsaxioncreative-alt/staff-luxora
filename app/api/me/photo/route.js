import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { verifyWorker } from "@/lib/verifyWorker";

// Returns a signed upload ticket. The browser uploads the image straight to Cloudinary,
// so the API secret never leaves the server and the file never passes through this app.
export async function POST(request) {
  const w = await verifyWorker(request);
  if (!w) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Photo upload is not set up yet" }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // One photo per worker: uploading again replaces the old one.
  const params = {
    invalidate: "true",
    overwrite: "true",
    public_id: `workers/${w.uid}`,
    timestamp: String(timestamp),
  };

  // Cloudinary signs the params sorted by name, joined as key=value&key=value, plus the secret.
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  return NextResponse.json({ cloudName, apiKey, signature, ...params });
}