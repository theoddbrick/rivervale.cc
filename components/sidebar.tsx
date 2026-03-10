"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CheckSquare,
  Bot,
  Clock,
  Settings,
  Heart,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const nav = [
  { href: "/activity", icon: Activity, label: "Activity" },
  { href: "/tasks",    icon: CheckSquare, label: "Tasks" },
  { href: "/agents",   icon: Bot,         label: "Agents" },
  { href: "/crons",    icon: Clock,       label: "Crons" },
  { href: "/config",   icon: Settings,    label: "Config" },
  { href: "/health",   icon: Heart,       label: "Health" },
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
    <aside className="w-56 shrink-0 flex flex-col bg-rv-surface border-r border-rv-border h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-rv-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-rv-accent flex items-center justify-center text-sm">
            🏠
          </div>
          <span className="text-rv-text font-semibold text-sm">Rivervale</span>
        </div>
        <p className="text-rv-subtle text-xs mt-1">OpenClaw Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-rv-accent/15 text-rv-accent-hover font-medium"
                  : "text-rv-subtle hover:text-rv-text hover:bg-rv-muted/50"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-rv-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rv-subtle hover:text-rv-text hover:bg-rv-muted/50 transition-colors w-full"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
