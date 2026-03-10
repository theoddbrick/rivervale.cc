"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  CheckSquare,
  Bot,
  Clock,
  Settings,
  Heart,
  LogOut,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/activity", icon: Activity, label: "Activity" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/agents", icon: Bot, label: "Agents" },
  { href: "/crons", icon: Clock, label: "Crons" },
  { href: "/config", icon: Settings, label: "Config" },
  { href: "/health", icon: Heart, label: "Health" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-[220px] shrink-0 flex flex-col glass h-screen sticky top-0 border-r border-white/[0.04]">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-rv-accent/20 flex items-center justify-center">
            <Zap size={14} className="text-rv-accent" />
            <div className="absolute inset-0 rounded-lg bg-rv-accent/10 animate-[pulse-dot_3s_ease-in-out_infinite]" />
          </div>
          <div>
            <span className="text-rv-text font-semibold text-[13px] tracking-tight">
              Rivervale
            </span>
            <p className="text-rv-subtle text-[10px] tracking-wide uppercase">
              OpenClaw
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 ${
                active
                  ? "text-white font-medium"
                  : "text-rv-subtle hover:text-rv-text"
              }`}
            >
              {/* Active background */}
              {active && (
                <div className="absolute inset-0 rounded-lg bg-rv-accent/[0.12] border border-rv-accent/[0.15]" />
              )}
              {/* Active left edge */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-rv-accent" />
              )}
              {/* Hover background */}
              {!active && (
                <div className="absolute inset-0 rounded-lg bg-rv-muted/0 group-hover:bg-rv-muted/30 transition-colors duration-200" />
              )}
              <Icon
                size={15}
                className={`relative z-10 transition-colors duration-200 ${
                  active ? "text-rv-accent-hover" : ""
                }`}
              />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/[0.04]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-rv-subtle hover:text-rv-text transition-colors duration-200 w-full group"
        >
          <LogOut
            size={15}
            className="group-hover:text-red-400 transition-colors duration-200"
          />
          Sign out
        </button>
      </div>
    </aside>
  );
}
