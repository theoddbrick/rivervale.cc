import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { timeAgo, statusColor, formatDate } from "@/lib/utils";
import type { SystemHealth } from "@/lib/types";
import { Heart, Shield, AlertTriangle, XOctagon } from "lucide-react";

export const revalidate = 30;

export default async function HealthPage() {
  const supabase = await createClient();

  const { data: checks } = await supabase
    .from("system_health")
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(200);

  const checksList = (checks as SystemHealth[] | null) ?? [];

  // Latest check per agent+component
  const latest = new Map<string, SystemHealth>();
  checksList.forEach((c) => {
    const key = `${c.agent}:${c.component}`;
    if (!latest.has(key)) latest.set(key, c);
  });

  const latestChecks = Array.from(latest.values());
  const ok = latestChecks.filter((c) => c.status === "ok").length;
  const warnings = latestChecks.filter((c) => c.status === "warning").length;
  const errors = latestChecks.filter((c) => c.status === "error").length;

  const overallStatus =
    errors > 0 ? "error" : warnings > 0 ? "warning" : "ok";
  const overallLabel =
    overallStatus === "ok"
      ? "All systems healthy"
      : overallStatus === "warning"
        ? "System degraded"
        : "System unhealthy";
  const overallIcon =
    overallStatus === "ok"
      ? Shield
      : overallStatus === "warning"
        ? AlertTriangle
        : XOctagon;
  const OverallIcon = overallIcon;
  const overallDot =
    overallStatus === "ok"
      ? "bg-green-400"
      : overallStatus === "warning"
        ? "bg-yellow-400"
        : "bg-red-400";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <AutoRefresh />
      <div className="flex items-start justify-between mb-8 animate-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-pink-500/[0.12] flex items-center justify-center">
              <Heart size={15} className="text-pink-400" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              System Health
            </h1>
          </div>
          <p className="text-rv-subtle text-[13px] ml-11">
            Latest check per component
          </p>
        </div>
        <div
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl card text-[13px] font-medium ${statusColor(overallStatus)}`}
        >
          <div className={`w-2 h-2 rounded-full ${overallDot} dot-pulse`} />
          <OverallIcon size={14} />
          {overallLabel}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="card stat-card p-4 animate-in s1" style={{ "--stat-glow": "rgba(34, 197, 94, 0.15)" } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 dot-pulse" />
            <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium">
              OK
            </p>
          </div>
          <p className="text-3xl font-bold text-green-400 tracking-tight">
            {ok}
          </p>
        </div>
        <div className="card stat-card p-4 animate-in s2" style={{ "--stat-glow": "rgba(234, 179, 8, 0.15)" } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 dot-pulse-fast" />
            <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium">
              Warnings
            </p>
          </div>
          <p className="text-3xl font-bold text-yellow-400 tracking-tight">
            {warnings}
          </p>
        </div>
        <div className="card stat-card p-4 animate-in s3" style={{ "--stat-glow": "rgba(239, 68, 68, 0.15)" } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 dot-pulse-fast" />
            <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium">
              Errors
            </p>
          </div>
          <p className="text-3xl font-bold text-red-400 tracking-tight">
            {errors}
          </p>
        </div>
      </div>

      {latestChecks.length > 0 ? (
        <div className="card overflow-hidden mb-6 animate-in s4">
          <div className="px-5 py-3 border-b border-rv-border/60">
            <p className="text-rv-subtle text-[11px] font-semibold uppercase tracking-wider">
              Latest per component
            </p>
          </div>
          <div className="overflow-x-auto">
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
                    return (
                      (order[a.status as keyof typeof order] ?? 3) -
                      (order[b.status as keyof typeof order] ?? 3)
                    );
                  })
                  .map((check) => (
                    <tr key={check.id}>
                      <td>
                        {check.agent ? (
                          <AgentBadge agent={check.agent} size="sm" />
                        ) : (
                          <span className="text-rv-subtle/60 text-[12px]">
                            system
                          </span>
                        )}
                      </td>
                      <td className="font-mono text-[12px] text-rv-text">
                        {check.component}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              check.status === "ok"
                                ? "bg-green-400 dot-pulse"
                                : check.status === "warning"
                                  ? "bg-yellow-400 dot-pulse-fast"
                                  : "bg-red-400 dot-pulse-fast"
                            }`}
                          />
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${statusColor(check.status ?? "")}`}
                          >
                            {check.status}
                          </span>
                        </div>
                      </td>
                      <td
                        className="text-rv-subtle text-[12px]"
                        title={formatDate(check.checked_at)}
                      >
                        {timeAgo(check.checked_at)}
                      </td>
                      <td className="text-rv-subtle text-[12px] max-w-xs truncate font-mono">
                        {Object.keys(check.details).length > 0
                          ? JSON.stringify(check.details)
                          : "\u2014"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card py-20 text-center mb-6 animate-in s4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rv-muted/30 mb-4">
            <Heart size={22} className="text-rv-subtle/50" />
          </div>
          <p className="text-rv-subtle text-sm font-medium">
            No health checks recorded yet
          </p>
          <p className="text-rv-subtle/60 text-[12px] mt-1 max-w-xs mx-auto">
            Agents use{" "}
            <code className="font-mono text-rv-subtle/80">
              supabase health
            </code>{" "}
            to report here.
          </p>
        </div>
      )}

      {/* Full history */}
      {checksList.length > 0 && (
        <div className="card overflow-hidden animate-in s5">
          <div className="px-5 py-3 border-b border-rv-border/60">
            <p className="text-rv-subtle text-[11px] font-semibold uppercase tracking-wider">
              Full history
            </p>
          </div>
          <div className="overflow-x-auto">
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
                {checksList.slice(0, 50).map((check) => (
                  <tr key={check.id}>
                    <td
                      className="text-rv-subtle text-[12px]"
                      title={formatDate(check.checked_at)}
                    >
                      {timeAgo(check.checked_at)}
                    </td>
                    <td>
                      {check.agent ? (
                        <AgentBadge agent={check.agent} size="sm" />
                      ) : (
                        <span className="text-rv-subtle/40 text-[12px]">
                          \u2014
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-[12px] text-rv-text">
                      {check.component}
                    </td>
                    <td>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${statusColor(check.status ?? "")}`}
                      >
                        {check.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
