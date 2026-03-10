import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { timeAgo, statusColor, formatDate } from "@/lib/utils";
import type { SystemHealth } from "@/lib/types";

export const revalidate = 30;

const COMPONENTS = ["gateway", "models", "telegram", "memory", "disk", "network"];

export default async function HealthPage() {
  const supabase = await createClient();

  const { data: checks } = await supabase
    .from("system_health")
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(200);

  // Latest check per agent+component
  const latest = new Map<string, SystemHealth>();
  (checks as SystemHealth[] | null)?.forEach((c) => {
    const key = `${c.agent}:${c.component}`;
    if (!latest.has(key)) latest.set(key, c);
  });

  const latestChecks = Array.from(latest.values());
  const ok       = latestChecks.filter((c) => c.status === "ok").length;
  const warnings = latestChecks.filter((c) => c.status === "warning").length;
  const errors   = latestChecks.filter((c) => c.status === "error").length;

  const overallStatus = errors > 0 ? "error" : warnings > 0 ? "warning" : "ok";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-rv-text">System Health</h1>
          <p className="text-rv-subtle text-sm mt-0.5">Latest check per component</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${statusColor(overallStatus)}`}>
          <span className={`w-2 h-2 rounded-full ${overallStatus === "ok" ? "bg-green-400" : overallStatus === "warning" ? "bg-yellow-400" : "bg-red-400"}`} />
          System {overallStatus === "ok" ? "healthy" : overallStatus === "warning" ? "degraded" : "unhealthy"}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">OK</p>
          <p className="text-2xl font-bold text-green-400">{ok}</p>
        </div>
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">Warnings</p>
          <p className="text-2xl font-bold text-yellow-400">{warnings}</p>
        </div>
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">Errors</p>
          <p className="text-2xl font-bold text-red-400">{errors}</p>
        </div>
      </div>

      {latestChecks.length > 0 ? (
        <div className="bg-rv-surface border border-rv-border rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-rv-border">
            <p className="text-rv-subtle text-xs font-semibold uppercase tracking-wider">Latest per component</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Component</th>
                <th>Status</th>
                <th>Last checked</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {latestChecks
                .sort((a, b) => {
                  const order = { error: 0, warning: 1, ok: 2 };
                  return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
                })
                .map((check) => (
                  <tr key={check.id}>
                    <td>
                      {check.agent ? (
                        <AgentBadge agent={check.agent} size="sm" />
                      ) : (
                        <span className="text-rv-subtle text-xs">system</span>
                      )}
                    </td>
                    <td className="font-mono text-xs text-rv-text">{check.component}</td>
                    <td>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColor(check.status ?? "")}`}>
                        {check.status}
                      </span>
                    </td>
                    <td className="text-rv-subtle text-xs" title={formatDate(check.checked_at)}>
                      {timeAgo(check.checked_at)}
                    </td>
                    <td className="text-rv-subtle text-xs max-w-xs truncate">
                      {Object.keys(check.details).length > 0
                        ? JSON.stringify(check.details)
                        : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-rv-surface border border-rv-border rounded-xl py-16 text-center text-rv-subtle mb-6">
          <p className="text-4xl mb-3">❤️</p>
          <p className="text-sm">No health checks recorded yet.</p>
          <p className="text-xs mt-1">
            Agents use <code className="font-mono">supabase health &lt;agent&gt; &lt;component&gt; ok</code> to report here.
          </p>
        </div>
      )}

      {/* Full history */}
      {checks && checks.length > 0 && (
        <div className="bg-rv-surface border border-rv-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-rv-border">
            <p className="text-rv-subtle text-xs font-semibold uppercase tracking-wider">Full history</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Agent</th>
                <th>Component</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(checks as SystemHealth[]).slice(0, 50).map((check) => (
                <tr key={check.id}>
                  <td className="text-rv-subtle text-xs" title={formatDate(check.checked_at)}>
                    {timeAgo(check.checked_at)}
                  </td>
                  <td>
                    {check.agent ? <AgentBadge agent={check.agent} size="sm" /> : <span className="text-rv-subtle text-xs">—</span>}
                  </td>
                  <td className="font-mono text-xs text-rv-text">{check.component}</td>
                  <td>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColor(check.status ?? "")}`}>
                      {check.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
