import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { timeAgo, categoryColor, formatDate } from "@/lib/utils";

export const revalidate = 30;

const AGENTS = [
  { name: "🏠 Housekeeper", role: "System administrator, agent HR", telegram: "@HousekeepRivervale_bot" },
  { name: "🐼 Panda",       role: "Joseph's personal assistant",    telegram: "@panda_papercrateBot" },
  { name: "🐻‍❄️ PolarBear",  role: "Grace's personal assistant",    telegram: "@Polarbear_rivervaleBot" },
  { name: "🔧 Architect",   role: "Infrastructure & config",        telegram: "@architect_bot" },
];

export default async function AgentsPage() {
  const supabase = await createClient();

  // Last log per agent
  const { data: recentLogs } = await supabase
    .from("agent_logs")
    .select("agent, created_at, title, category")
    .order("created_at", { ascending: false })
    .limit(200);

  // Last 7 days activity per agent
  const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: week } = await supabase
    .from("agent_logs")
    .select("agent")
    .gte("created_at", since7d);

  // Latest health per agent
  const { data: health } = await supabase
    .from("system_health")
    .select("agent, component, status, checked_at")
    .order("checked_at", { ascending: false })
    .limit(50);

  const lastLog = (agentName: string) =>
    recentLogs?.find((l) => l.agent === agentName);

  const weekCount = (agentName: string) =>
    week?.filter((l) => l.agent === agentName).length ?? 0;

  const latestHealth = (agentName: string) => {
    const h = health?.find((h) => h.agent === agentName);
    return h;
  };

  const recentActivity = (agentName: string) =>
    recentLogs?.filter((l) => l.agent === agentName).slice(0, 5) ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-rv-text">Agents</h1>
        <p className="text-rv-subtle text-sm mt-0.5">Status and recent activity for all active agents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {AGENTS.map((agent) => {
          const last    = lastLog(agent.name);
          const count7d = weekCount(agent.name);
          const h       = latestHealth(agent.name);
          const recent  = recentActivity(agent.name);

          return (
            <div key={agent.name} className="bg-rv-surface border border-rv-border rounded-xl p-5">
              {/* Agent header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <AgentBadge agent={agent.name} />
                  <p className="text-rv-subtle text-xs mt-1">{agent.role}</p>
                  <p className="text-rv-subtle/60 text-xs">{agent.telegram}</p>
                </div>
                <div className="text-right">
                  <p className="text-rv-text font-semibold text-lg">{count7d}</p>
                  <p className="text-rv-subtle text-xs">logs / 7d</p>
                </div>
              </div>

              {/* Last active */}
              {last ? (
                <div className="mb-3 p-3 bg-rv-bg rounded-lg border border-rv-border/50">
                  <p className="text-rv-subtle text-xs mb-0.5">Last active</p>
                  <p className="text-rv-text text-sm truncate">{last.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColor(last.category)}`}>
                      {last.category}
                    </span>
                    <span className="text-rv-subtle text-xs" title={formatDate(last.created_at)}>
                      {timeAgo(last.created_at)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-3 p-3 bg-rv-bg rounded-lg border border-rv-border/50">
                  <p className="text-rv-subtle text-xs">No activity recorded yet</p>
                </div>
              )}

              {/* Health */}
              {h && (
                <div className="mb-3 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${h.status === "ok" ? "bg-green-400" : h.status === "warning" ? "bg-yellow-400" : "bg-red-400"}`} />
                  <span className="text-rv-subtle text-xs">
                    {h.component} · {h.status} · {timeAgo(h.checked_at)}
                  </span>
                </div>
              )}

              {/* Recent 5 */}
              {recent.length > 0 && (
                <div className="space-y-1">
                  <p className="text-rv-subtle text-xs mb-1.5">Recent</p>
                  {recent.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`shrink-0 px-1 py-0.5 rounded ${categoryColor(l.category)}`}>
                        {l.category}
                      </span>
                      <span className="text-rv-subtle truncate">{l.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
