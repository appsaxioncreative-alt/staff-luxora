"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const LOGO_SRC = "/logo.png"; // file in the public folder (project root)

const friendly = (code) =>
  ({
    "auth/invalid-credential": "Email or password is wrong.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-disabled": "This account has been disabled. Contact the office.",
    "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
    "auth/network-request-failed": "No connection. Check your internet and try again.",
  })[code] || "Could not sign in. Try again.";

export default function Login() {
  const { user, loading, authError } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/jobs");
  }, [user, loading, router]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // AuthContext now checks the account is a worker and redirects.
    } catch (err) {
      setError(friendly(err.code));
      setBusy(false);
    }
  }

  // stop the spinner once AuthContext has decided (rejected non-worker accounts land here)
  useEffect(() => {
    if (authError) setBusy(false);
  }, [authError]);

  const shown = error || authError;

  return (
    <div className="login">
      <div className="login-hero">
        <div
          className="mark"
          style={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            border: "3px solid rgba(255,255,255,0.9)",
          }}
        >
          <img
            src={LOGO_SRC}
            alt="Luxora"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
              display: "block",
            }}
          />
        </div>
        <h1>Luxora</h1>
        <p>Staff Login Portal</p>
      </div>

      <form className="login-card" onSubmit={submit}>
        <h2>Sign in</h2>
        {shown && <div className="msg err" role="alert">{shown}</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="pw">
            <input id="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="link" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button>
          </div>
        </div>
        <button className="btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="hint">Forgot your password? Ask the office to reset it.</p>
      </form>
    </div>
  );
}