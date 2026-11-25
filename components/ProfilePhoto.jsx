"use client";
import { useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

const MAX_MB = 5;

const initials = (n = "") => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";

// Square, face-centred version of the Cloudinary image (160px so it stays sharp on phones).
const thumb = (url) => url.replace("/image/upload/", "/image/upload/c_fill,g_face,w_160,h_160,f_auto,q_auto/");

// One avatar that doubles as the uploader: tap it to add or change the photo.
// Usage: <ProfilePhoto worker={worker} onChange={updateWorker} />
export default function ProfilePhoto({ worker, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) return setError("Choose an image file");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Under ${MAX_MB} MB please`);

    setBusy(true);
    try {
      // 1. get a signed ticket from our server
      const t = await apiFetch("/api/me/photo", { method: "POST" });

      // 2. upload straight to Cloudinary
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", t.apiKey);
      fd.append("timestamp", t.timestamp);
      fd.append("signature", t.signature);
      fd.append("public_id", t.public_id);
      fd.append("overwrite", t.overwrite);
      fd.append("invalidate", t.invalidate);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${t.cloudName}/image/upload`, { method: "POST", body: fd });
      const up = await res.json();
      if (!res.ok) throw new Error(up.error?.message || "Upload failed");

      // 3. save the image link on the worker
      const d = await apiFetch("/api/me", { method: "PATCH", body: JSON.stringify({ photoUrl: up.secure_url }) });
      onChange?.(d.worker);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const d = await apiFetch("/api/me", { method: "PATCH", body: JSON.stringify({ photoUrl: "" }) });
      onChange?.(d.worker);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ position: "relative" }}>
        {/* "avatar" keeps your existing circle size and colours */}
        <button
          type="button"
          className="avatar"
          onClick={() => input.current?.click()}
          disabled={busy}
          aria-label={worker.photo ? "Change profile photo" : "Add profile photo"}
          style={{ border: 0, padding: 0, overflow: "hidden", cursor: "pointer", opacity: busy ? 0.6 : 1 }}
        >
          {worker.photo ? (
            <img src={thumb(worker.photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            initials(worker.name)
          )}
        </button>

        {/* small camera badge so it's clear the avatar can be tapped */}
        <span
          aria-hidden="true"
          style={{ position: "absolute", right: -2, bottom: -2, width: 24, height: 24, borderRadius: "50%", background: "#059669", border: "2px solid #fff", display: "grid", placeItems: "center", pointerEvents: "none" }}
        >
          {busy ? (
            <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>…</span>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          )}
        </span>
      </div>

      <input ref={input} type="file" accept="image/*" hidden onChange={onPick} />

      {worker.photo && !busy && (
        <button type="button" onClick={remove} style={{ background: "none", border: 0, padding: 0, fontSize: 12, color: "#6b7280", textDecoration: "underline", cursor: "pointer" }}>
          Remove
        </button>
      )}
      {error && <small role="alert" style={{ color: "#b91c1c", maxWidth: 120, textAlign: "center" }}>{error}</small>}
    </div>
  );
}