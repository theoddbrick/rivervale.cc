"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/activity");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-rv-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-rv-accent/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-agent-architect/[0.03] blur-[100px]" />
      </div>

      <div className="w-full max-w-[380px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-10 animate-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rv-accent/[0.12] border border-rv-accent/[0.15] mb-5 relative">
            <Zap size={24} className="text-rv-accent" />
            <div className="absolute inset-0 rounded-2xl animate-[pulse-dot_3s_ease-in-out_infinite] bg-rv-accent/[0.06]" />
          </div>
          <h1 className="text-rv-text text-2xl font-semibold tracking-tight">
            Rivervale
          </h1>
          <p className="text-rv-subtle text-[13px] mt-1 tracking-wide">
            OpenClaw Dashboard
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-7 glow-border animate-in s2">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[12px] text-rv-subtle mb-2 uppercase tracking-wider font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="joseph@rivervale.cc"
                className="w-full px-3.5 py-2.5 rounded-xl bg-rv-bg/80 border border-rv-border text-rv-text text-sm placeholder:text-rv-subtle/40 focus:outline-none focus:border-rv-accent/50 focus:ring-1 focus:ring-rv-accent/20 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[12px] text-rv-subtle mb-2 uppercase tracking-wider font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-rv-bg/80 border border-rv-border text-rv-text text-sm placeholder:text-rv-subtle/40 focus:outline-none focus:border-rv-accent/50 focus:ring-1 focus:ring-rv-accent/20 transition-all duration-200 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-rv-subtle hover:text-rv-text transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-400/[0.08] border border-red-400/[0.15] rounded-xl px-3.5 py-2.5 animate-scale">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-rv-accent hover:bg-rv-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 relative overflow-hidden group"
            >
              <span className={loading ? "opacity-0" : ""}>Sign in</span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-rv-subtle/30 text-[11px] mt-8 tracking-wider uppercase animate-in s4">
          Private access only
        </p>
      </div>
    </div>
  );
}
