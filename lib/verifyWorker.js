import { adminAuth, adminDb } from "./firebaseAdmin";

// Returns the worker (uid, name, email, phone) if the caller has a valid ID token
// AND a profile in the "users" collection (the people the admin adds on the Users page).
export async function verifyWorker(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection("users").doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data();
    return { uid: decoded.uid, name: d.name, email: d.email, phone: d.phone || "", createdAt: d.createdAt, ref: snap.ref };
  } catch {
    return null;
  }
}
