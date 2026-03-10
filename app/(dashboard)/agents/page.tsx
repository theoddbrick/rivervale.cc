import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { timeAgo, categoryColor, formatDate, agentSlug } from "@/lib/utils";
import type { Heartbeat } from "@/lib/types";
import { Bot, MessageSquare, Wifi } from "lucide-react";

export const revalidate = 30;

const AGENTS = [
  {
    name: "\u{1F3E0} Housekeeper",
    role: "System administrator, agent HR",
    telegram: "@HousekeepRivervale_bot",
    gradient: "from-amber-500/10 to-transparent",
    dot: "bg-amber-400",
  },
  {
    name: "\u{1F43C} Panda",
    role: "Joseph\u2019s personal assistant",
    telegram: "@panda_papercrateBot",
    gradient: "from-emerald-500/10 to-transparent",
    dot: "bg-emerald-400",
  },
  {
    name: "\u{1F43B}\u200D\u2744\uFE0F PolarBear",
    role: "Grace\u2019s personal assistant",
    telegram: "@Polarbear_rivervaleBot",
    gradient: "from-blue-500/10 to-transparent",
    dot: "bg-blue-400",
  },
  {
    name: "\u{1F527} Architect",
    role: "Infrastructure & config",
    telegram: "@architect_bot",
    gradient: "from-violet-500/10 to-transparent",
    dot: "bg-violet-400",
  },
];

export default async function AgentsPage() {
  const supabase = await createClient();

  type LogEntry = {
    agent: string;
    created_at: string;
    title: string;
    category: string;
  };
  type WeekEntry = { agent: string };
  type HealthEntry = {
    agent: string | null;
    component: string | null;
    status: string | null;
    checked_at: string;
  };

  const { data: recentLogsRaw } = await supabase
    .from("agent_logs")
    .select("agent, created_at, title, category")
    .order("created_at", { ascending: false })
    .limit(200);
  const recentLogs = (recentLogsRaw ?? []) as LogEntry[];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since7d = sevenDaysAgo.toISOString();
  const { data: weekRaw } = await supabase
    .from("agent_logs")
    .select("agent")
    .gte("created_at", since7d);
  const week = (weekRaw ?? []) as WeekEntry[];

  const { data: healthRaw } = await supabase
    .from("system_health")
    .select("agent, component, status, checked_at")
    .order("checked_at", { ascending: false })
    .limit(50);
  const health = (healthRaw ?? []) as HealthEntry[];

  const { data: heartbeatsRaw } = await supabase
    .from('heartbeats')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(20)
  const heartbeats = (heartbeatsRaw ?? []) as Heartbeat[];

  const lastLog = (agentName: string) =>
    recentLogs.find((l) => l.agent === agentName);

  const weekCount = (agentName: string) =>
    week.filter((l) => l.agent === agentName).length;

  const latestHealth = (agentName: string) =>
    health.find((h) => h.agent === agentName);

  const recentActivity = (agentName: string) =>
    recentLogs.filter((l) => l.agent === agentName).slice(0, 5);

  const latestHeartbeat = (agentName: string) =>
    heartbeats.find((hb) => hb.agent === agentName);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <AutoRefresh />
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-violet-500/[0.12] flex items-center justify-center">
            <Bot size={15} className="text-violet-400" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Agents</h1>
        </div>
        <p className="text-rv-subtle text-[13px] ml-11">
          Status and recent activity for all active agents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {AGENTS.map((agent, i) => {
          const last = lastLog(agent.name);
          const count7d = weekCount(agent.name);
          const h = latestHealth(agent.name);
          const hb = latestHeartbeat(agent.name);
          const recent = recentActivity(agent.name);
          const slug = agentSlug(agent.name);
          const glowClass = `glow-${slug}`;

          return (
            <div
              key={agent.name}
              className={`card card-hover overflow-hidden animate-in s${i + 1} ${glowClass}`}
            >
              {/* Ambient gradient top */}
              <div
                className={`h-1 bg-gradient-to-r ${agent.gradient} opacity-60`}
              />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <AgentBadge agent={agent.name} />
                    <p className="text-rv-subtle text-[12px] mt-1.5">
                      {agent.role}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MessageSquare size={10} className="text-rv-subtle/50" />
                      <p className="text-rv-subtle/50 text-[11px] font-mono">
                        {agent.telegram}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-rv-text font-bold text-2xl tracking-tight">
                      {count7d}
                    </p>
                    <p className="text-rv-subtle text-[11px]">logs / 7d</p>
                  </div>
                </div>

                {/* Last active */}
                {last ? (
                  <div className="mb-3 p-3 bg-rv-bg/60 rounded-xl border border-rv-border/40">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${agent.dot} dot-pulse`} />
                      <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium">
                        Last active
                      </p>
                    </div>
                    <p className="text-rv-text text-[13px] truncate font-medium">
                      {last.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md ${categoryColor(last.category)}`}
                      >
                        {last.category}
                      </span>
                      <span
                        className="text-rv-subtle/60 text-[11px]"
                        title={formatDate(last.created_at)}
                      >
                        {timeAgo(last.created_at)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 p-3 bg-rv-bg/60 rounded-xl border border-rv-border/40">
                    <p className="text-rv-subtle/50 text-[12px]">
                      No activity recorded yet
                    </p>
                  </div>
                )}

                {/* Health */}
                {h && (
                  <div className="mb-3 flex items-center gap-2">
                    <Wifi size={11} className="text-rv-subtle/50" />
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        h.status === "ok"
                          ? "bg-green-400 dot-pulse"
                          : h.status === "warning"
                            ? "bg-yellow-400 dot-pulse-fast"
                            : "bg-red-400 dot-pulse-fast"
                      }`}
                    />
                    <span className="text-rv-subtle text-[11px]">
                      {h.component} &middot; {h.status} &middot;{" "}
                      {timeAgo(h.checked_at)}
                    </span>
                  </div>
                )}

                {/* Heartbeat */}
                {hb && (
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          hb.status === "ok"
                            ? "bg-green-400 dot-pulse"
                            : hb.status === "warning"
                              ? "bg-yellow-400 dot-pulse-fast"
                              : "bg-red-400 dot-pulse-fast"
                        }`}
                      />
                      <span className="text-rv-subtle text-[11px]">
                        Heartbeat {timeAgo(hb.checked_at)}
                      </span>
                    </div>
                    {hb.context_pct != null && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-rv-subtle text-[10px]">ctx</span>
                        <div className="w-16 h-1.5 rounded-full bg-rv-muted/60 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              hb.context_pct > 80
                                ? "bg-red-400"
                                : hb.context_pct > 50
                                  ? "bg-yellow-400"
                                  : "bg-green-400"
                            }`}
                            style={{ width: `${Math.min(hb.context_pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-rv-subtle text-[10px] font-mono">
                          {hb.context_pct}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent */}
                {recent.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-rv-subtle text-[11px] mb-1.5 uppercase tracking-wider font-medium">
                      Recent
                    </p>
                    {recent.map((l, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-[12px] py-0.5"
                      >
                        <span
                          className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] ${categoryColor(l.category)}`}
                        >
                          {l.category}
                        </span>
                        <span className="text-rv-subtle truncate">
                          {l.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
