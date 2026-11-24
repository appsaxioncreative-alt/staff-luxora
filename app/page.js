"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) router.replace(user ? "/jobs" : "/login");
  }, [user, loading, router]);
  return <div className="center"><div className="spinner" aria-label="Loading" /></div>;
}
