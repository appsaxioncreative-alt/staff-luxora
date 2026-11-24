"use client";
import { useEffect, useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { isActive } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

const initials = (n = "") => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";

const pwError = (code) =>
  ({
    "auth/invalid-credential": "Current password is wrong.",
    "auth/wrong-password": "Current password is wrong.",
    "auth/weak-password": "New password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
    "auth/requires-recent-login": "Sign out and sign in again, then retry.",
  })[code] || "Could not change the password.";

export default function ProfilePage() {
  const { worker, updateWorker, logout } = useAuth();
  const [stats, setStats] = useState(null);

  const [phone, setPhone] = useState(worker?.phone || "");
  const [phoneMsg, setPhoneMsg] = useState(null);
  const [phoneBusy, setPhoneBusy] = useState(false);

  const [pw, setPw] = useState({ current: "", next: "", again: "" });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    apiFetch("/api/jobs")
      .then(({ jobs }) =>
        setStats({
          total: jobs.length,
          active: jobs.filter(isActive).length,
          returned: jobs.filter((j) => j.fieldStage === "returned").length,
        })
      )
      .catch(() => setStats(null));
  }, []);

  async function savePhone(e) {
    e.preventDefault();
    setPhoneBusy(true);
    setPhoneMsg(null);
    try {
      const d = await apiFetch("/api/me", { method: "PATCH", body: JSON.stringify({ phone }) });
      updateWorker(d.worker);
      setPhoneMsg({ ok: "Phone number saved." });
    } catch (err) {
      setPhoneMsg({ err: err.message });
    }
    setPhoneBusy(false);
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next.length < 6) return setPwMsg({ err: "New password must be at least 6 characters." });
    if (pw.next !== pw.again) return setPwMsg({ err: "The new passwords don’t match." });
    setPwBusy(true);
    try {
      const u = auth.currentUser;
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, pw.current));
      await updatePassword(u, pw.next);
      setPw({ current: "", next: "", again: "" });
      setPwMsg({ ok: "Password changed." });
    } catch (err) {
      setPwMsg({ err: pwError(err.code) });
    }
    setPwBusy(false);
  }

  if (!worker) return null;

  return (
    <>
      <header className="top profile-top">
        <div className="avatar" aria-hidden="true">{initials(worker.name)}</div>
        <div>
          <h1>{worker.name}</h1>
          <p className="muted">{worker.email}</p>
        </div>
      </header>

      {stats && (
        <section className="stats">
          <div><strong>{stats.active}</strong><span>Active</span></div>
          <div><strong>{stats.returned}</strong><span>Returned</span></div>
          <div><strong>{stats.total}</strong><span>All jobs</span></div>
        </section>
      )}

      <section className="card">
        <h2>Contact</h2>
        <form onSubmit={savePhone}>
          <div className="field">
            <label>Name</label>
            <input value={worker.name} disabled />
            <small>Only the office can change your name.</small>
          </div>
          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {phoneMsg?.ok && <div className="msg ok">{phoneMsg.ok}</div>}
          {phoneMsg?.err && <div className="msg err">{phoneMsg.err}</div>}
          <button className="btn" disabled={phoneBusy || phone.trim() === (worker.phone || "")}>{phoneBusy ? "Saving…" : "Save phone number"}</button>
        </form>
      </section>

      <section className="card">
        <h2>Change password</h2>
        <form onSubmit={changePassword}>
          <div className="field">
            <label htmlFor="cur">Current password</label>
            <input id="cur" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="new">New password</label>
            <input id="new" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="again">Repeat new password</label>
            <input id="again" type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} required />
          </div>
          {pwMsg?.ok && <div className="msg ok">{pwMsg.ok}</div>}
          {pwMsg?.err && <div className="msg err">{pwMsg.err}</div>}
          <button className="btn" disabled={pwBusy}>{pwBusy ? "Changing…" : "Change password"}</button>
        </form>
      </section>

      <button className="btn ghost danger" onClick={logout}>Sign out</button>
    </>
  );
}
