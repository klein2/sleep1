"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = useCallback((message: string, kind: "success" | "error") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 1400);
  }, []);

  useEffect(() => {
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
    };

    loadUser();
    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const logEvent = async (eventType: "sleep" | "wake", offsetMinutes = 0) => {
    if (!userId || busy) {
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
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <main>
      <div className="page">
        <header className="header">
          <h1 className="title">Sleep &amp; Wake Log</h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/history" className="link-btn">
              History
            </Link>
            <button className="subtle-btn" onClick={signOut} type="button">
              Logout
            </button>
          </div>
        </header>

        <div className="stack">
          {sleepButtons.map((button) => (
            <button
              key={button.label}
              className="cta cta-sleep"
              type="button"
              disabled={busy || !userId}
              onClick={() => logEvent("sleep", button.offsetMinutes)}
            >
              {button.label}
            </button>
          ))}

          <div className="section-spacer" />

          <button
            className="cta cta-wake"
            type="button"
            disabled={busy || !userId}
            onClick={() => logEvent("wake")}
          >
            Wake Up
          </button>
        </div>
      </div>

      {toast ? (
        <div className={`toast ${toast.kind === "success" ? "toast-success" : "toast-error"}`}>
          {toast.message}
        </div>
      ) : null}
    </main>
  );
}