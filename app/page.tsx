"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Toast = {
  message: string;
  kind: "success" | "error";
} | null;

const sleepButtons = [
  { label: "Sleep Now", offsetMinutes: 0 },
  { label: "Sleep +15m", offsetMinutes: 15 },
  { label: "Sleep +30m", offsetMinutes: 30 }
];

export default function HomePage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseBrowserClient> | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("Logout");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = useCallback((message: string, kind: "success" | "error") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 1400);
  }, []);

  useEffect(() => {
    setSupabase(getSupabaseBrowserClient());
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? "Logout");
    };

    loadUser();
    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const logEvent = async (eventType: "sleep" | "wake", offsetMinutes = 0) => {
    if (!supabase || !userId || busy) {
      return;
    }

    setBusy(true);

    const eventTime = new Date(Date.now() + offsetMinutes * 60 * 1000).toISOString();

    const { error } = await supabase.from("events").insert([
      {
        user_id: userId,
        event_type: eventType,
        event_time: eventTime
      }
    ]);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Saved", "success");
    }

    window.setTimeout(() => setBusy(false), 500);
  };

  const signOut = async () => {
    if (!supabase) {
      return;
    }

    const confirmed = window.confirm("Do you really want to log out?");
    if (!confirmed) {
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <main>
      <div className="page">
        <header className="header">
          <div className="header-left">
            <h1 className="title">Sleep &amp; Wake Log</h1>
            <button className="subtle-btn" onClick={signOut} type="button">
              {userEmail}
            </button>
          </div>
          <Link href="/history" className="link-btn">
            History
          </Link>
        </header>

        <div className="stack stack-main">
          {sleepButtons.map((button) => (
            <button
              key={button.label}
              className="cta cta-sleep"
              type="button"
              disabled={busy || !userId || !supabase}
              onClick={() => logEvent("sleep", button.offsetMinutes)}
            >
              {button.label}
            </button>
          ))}

          <div className="section-spacer" />

          <button
            className="cta cta-wake"
            type="button"
            disabled={busy || !userId || !supabase}
            onClick={() => logEvent("wake")}
          >
            Wake Up
          </button>

          {toast ? (
            <div className={`toast toast-inline ${toast.kind === "success" ? "toast-success" : "toast-error"}`}>
              {toast.message}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}