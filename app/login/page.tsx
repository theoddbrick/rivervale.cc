"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/activity");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-rv-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rv-accent/20 border border-rv-accent/30 text-2xl mb-4">
            🏠
          </div>
          <h1 className="text-rv-text text-2xl font-semibold">Rivervale</h1>
          <p className="text-rv-subtle text-sm mt-1">OpenClaw Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-rv-surface border border-rv-border rounded-xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-rv-subtle mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="joseph@example.com"
                className="w-full px-3 py-2.5 rounded-lg bg-rv-bg border border-rv-border text-rv-text text-sm placeholder:text-rv-subtle/50 focus:outline-none focus:border-rv-accent/60 focus:ring-1 focus:ring-rv-accent/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-rv-subtle mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg bg-rv-bg border border-rv-border text-rv-text text-sm placeholder:text-rv-subtle/50 focus:outline-none focus:border-rv-accent/60 focus:ring-1 focus:ring-rv-accent/30 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-rv-accent hover:bg-rv-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-rv-subtle/50 text-xs mt-6">
          Rivervale Household · Private access only
        </p>
      </div>
    </div>
  );
}
