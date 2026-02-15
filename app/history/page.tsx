"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { formatTimeInSeoul, kstTodayString, moveKstDate, utcRangeFromKstDate } from "@/lib/time";

type EventRow = {
  id: string;
  event_type: "sleep" | "wake";
  event_time: string;
  created_at: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseBrowserClient> | null>(null);
  const [selectedDate, setSelectedDate] = useState(kstTodayString());
  const [sleepTimes, setSleepTimes] = useState<string[]>([]);
  const [wakeTimes, setWakeTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRecords = sleepTimes.length > 0 || wakeTimes.length > 0;

  const sleepSuffix = (eventTime: string, createdAt: string) => {
    const diffMinutes = (new Date(eventTime).getTime() - new Date(createdAt).getTime()) / (60 * 1000);
    if (diffMinutes >= 14 && diffMinutes <= 16) {
      return " (+15m)";
    }
    if (diffMinutes >= 29 && diffMinutes <= 31) {
      return " (+30m)";
    }
    return "";
  };

  useEffect(() => {
    setSupabase(getSupabaseBrowserClient());
  }, []);

  const fetchDay = useCallback(async () => {
    if (!supabase) {
      return;
    }

    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    const { startUtc, endUtc } = utcRangeFromKstDate(selectedDate);
    const { data, error: queryError } = await supabase
      .from("events")
      .select("id, event_type, event_time, created_at")
      .eq("user_id", user.id)
      .gte("event_time", startUtc)
      .lt("event_time", endUtc)
      .order("event_time", { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setSleepTimes([]);
      setWakeTimes([]);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as EventRow[];
    setSleepTimes(
      rows
        .filter((r) => r.event_type === "sleep")
        .map((r) => `${formatTimeInSeoul(r.event_time)}${sleepSuffix(r.event_time, r.created_at)}`)
    );
    setWakeTimes(rows.filter((r) => r.event_type === "wake").map((r) => formatTimeInSeoul(r.event_time)));
    setLoading(false);
  }, [router, selectedDate, supabase]);

  useEffect(() => {
    fetchDay();
  }, [fetchDay]);

  const clearSelectedDate = async () => {
    if (!supabase) {
      return;
    }

    const confirmed = window.confirm(`Delete all logs for ${selectedDate}?`);
    if (!confirmed || clearing) {
      return;
    }

    setClearing(true);
    setError(null);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setClearing(false);
      router.replace("/login");
      return;
    }

    const { startUtc, endUtc } = utcRangeFromKstDate(selectedDate);
    const { data: targetRows, error: targetError } = await supabase
      .from("events")
      .select("id")
      .eq("user_id", user.id)
      .gte("event_time", startUtc)
      .lt("event_time", endUtc);

    if (targetError) {
      setError(targetError.message);
      setClearing(false);
      return;
    }

    const targetIds = (targetRows ?? []).map((row) => row.id as string);
    if (targetIds.length === 0) {
      setSleepTimes([]);
      setWakeTimes([]);
      setClearing(false);
      return;
    }

    const { data: deletedRows, error: deleteError } = await supabase
      .from("events")
      .delete()
      .in("id", targetIds)
      .select("id");

    if (deleteError) {
      setError(`Delete failed: ${deleteError.message}`);
      setClearing(false);
      return;
    }

    const deletedCount = (deletedRows ?? []).length;
    if (deletedCount !== targetIds.length) {
      setError("Some records were not deleted. Check DELETE policy in Supabase.");
    }

    await fetchDay();
    setClearing(false);
  };

  return (
    <main>
      <div className="page">
        <header className="header">
          <h1 className="title">History</h1>
          <Link href="/" className="link-btn">
            Back
          </Link>
        </header>

        <div className="card nav-row">
          <button className="subtle-btn" type="button" onClick={() => setSelectedDate(moveKstDate(selectedDate, -1))}>
            &lt; Yesterday
          </button>
          <button className="subtle-btn" type="button" onClick={() => setSelectedDate(kstTodayString())}>
            Today
          </button>
          <button className="subtle-btn" type="button" onClick={() => setSelectedDate(moveKstDate(selectedDate, 1))}>
            Tomorrow &gt;
          </button>
        </div>

        <div className="date-label">{selectedDate}</div>

        <button
          className="subtle-btn danger-btn"
          type="button"
          onClick={clearSelectedDate}
          disabled={loading || clearing || !hasRecords || !supabase}
        >
          {clearing ? "Clearing..." : "Clear"}
        </button>

        <section className="card">
          <h2 className="list-title">Sleep</h2>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : sleepTimes.length === 0 ? (
            <p className="muted">No records</p>
          ) : (
            <ul className="list">
              {sleepTimes.map((time, index) => (
                <li key={`sleep-${time}-${index}`}>{time}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="list-title">Wake</h2>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : wakeTimes.length === 0 ? (
            <p className="muted">No records</p>
          ) : (
            <ul className="list">
              {wakeTimes.map((time, index) => (
                <li key={`wake-${time}-${index}`}>{time}</li>
              ))}
            </ul>
          )}
        </section>

        {error ? <p className="muted">{error}</p> : null}
      </div>
    </main>
  );
}