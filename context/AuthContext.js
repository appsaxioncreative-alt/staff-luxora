"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setWorker(null);
        setLoading(false);
        return;
      }
      try {
        const { worker } = await apiFetch("/api/me");
        setAuthError("");
        setWorker(worker);
        setUser(u);
      } catch (e) {
        if (e.status === 401 || e.status === 403) {
          // valid Firebase account, but not a worker (for example the admin account)
          setAuthError(e.message);
          await signOut(auth);
          setUser(null);
          setWorker(null);
        } else {
          // network problem: keep them signed in with what we know
          setWorker({ id: u.uid, name: u.displayName || "Worker", email: u.email, phone: "" });
          setUser(u);
        }
      }
      setLoading(false);
    });
  }, []);

  const logout = () => signOut(auth);
  const updateWorker = useCallback((w) => setWorker(w), []);

  return (
    <AuthContext.Provider value={{ user, worker, loading, authError, logout, updateWorker }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
