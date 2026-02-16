"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { getSiteUrl } from "@/lib/siteUrl";

export default function LoginPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseBrowserClient> | null>(null);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalUsersFailed, setTotalUsersFailed] = useState(false);

  useEffect(() => {
    setSupabase(getSupabaseBrowserClient());

    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      setMessage(errorParam);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadTotalUsers = async () => {
      try {
        const response = await fetch("/api/stats/users", { cache: "no-store" });
        if (!response.ok) {
          if (mounted) {
            setTotalUsersFailed(true);
          }
          return;
        }

        const json = (await response.json()) as { count?: number };
        if (mounted && typeof json.count === "number") {
          setTotalUsers(json.count);
        } else if (mounted) {
          setTotalUsersFailed(true);
        }
      } catch {
        if (mounted) {
          setTotalUsersFailed(true);
        }
      }
    };

    loadTotalUsers();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    const guard = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (mounted && user) {
        router.replace("/");
      }
    };

    guard();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setMessage("Supabase client not ready.");
      return;
    }

    setLoading(true);
    setMessage(null);

    if (!email || !password) {
      setMessage("Email and password are required.");
      setLoading(false);
      return;
    }

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        router.replace("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getSiteUrl()}/auth/callback`
        }
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Sign-up complete. Check your email if confirmation is enabled.");
      }
    }

    setLoading(false);
  };

  const totalUsersLabel = totalUsers !== null ? String(totalUsers) : totalUsersFailed ? "unavailable" : "...";

  return (
    <main className="login-wrap">
      <div className="login-card">
        <h1 className="title">Sleep &amp; Wake Log</h1>
        {mode === "signin" ? <p className="muted">(total users: {totalUsersLabel})</p> : null}
        <p className="muted">{mode === "signin" ? "Sign in" : "Create account"} with email and password.</p>

        <form onSubmit={handleSubmit} className="stack">
          <label>
            <div className="field-label">Email</div>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </label>

          <label>
            <div className="field-label">Password</div>
            <input
              className="input"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </label>

          <button type="submit" className="cta cta-sleep" disabled={loading || !supabase}>
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          className="subtle-btn"
          onClick={() => {
            setMode((prev) => (prev === "signin" ? "signup" : "signin"));
            setMessage(null);
          }}
          disabled={loading}
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>

        {message ? <p className="muted">{message}</p> : null}
      </div>
    </main>
  );
}