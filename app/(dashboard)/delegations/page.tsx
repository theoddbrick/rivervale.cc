import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { timeAgo, formatDate, delegationStatusColor } from "@/lib/utils";
import type { Delegation } from "@/lib/types";
import { ArrowLeftRight } from "lucide-react";

export const revalidate = 30;

function formatDuration(created: string, completed: string): string {
  const ms = new Date(completed).getTime() - new Date(created).getTime();
  if (ms < 1000) return "<1s";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

export default async function DelegationsPage() {
  const supabase = await createClient();

  const { data: delegations } = await supabase
    .from("delegations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const list = (delegations as Delegation[] | null) ?? [];

  const total = list.length;
  const active = list.filter(
    (d) => d.status === "sent" || d.status === "acknowledged"
  ).length;
  const completed = list.filter((d) => d.status === "success").length;
  const failedTimeout = list.filter(
    (d) => d.status === "failed" || d.status === "timeout"
  ).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <AutoRefresh />
      {/* Header */}
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/[0.12] flex items-center justify-center">
            <ArrowLeftRight size={15} className="text-cyan-400" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Delegations</h1>
        </div>
        <p className="text-rv-subtle text-[13px] ml-11">
          Inter-agent task delegations and outcomes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div
          className="card stat-card p-4 animate-in s1"
          style={
            { "--stat-glow": "rgba(99, 102, 241, 0.15)" } as React.CSSProperties
          }
        >
          <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Total
          </p>
          <p className="text-3xl font-bold text-rv-text tracking-tight">
            {total}
          </p>
        </div>
        <div
          className="card stat-card p-4 animate-in s2"
          style={
            { "--stat-glow": "rgba(6, 182, 212, 0.15)" } as React.CSSProperties
          }
        >
          <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Active
          </p>
          <p className="text-3xl font-bold text-cyan-400 tracking-tight">
            {active}
          </p>
        </div>
        <div
          className="card stat-card p-4 animate-in s3"
          style={
            {
              "--stat-glow": "rgba(16, 185, 129, 0.15)",
            } as React.CSSProperties
          }
        >
          <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Completed
          </p>
          <p className="text-3xl font-bold text-emerald-400 tracking-tight">
            {completed}
          </p>
        </div>
        <div
          className="card stat-card p-4 animate-in s4"
          style={
            { "--stat-glow": "rgba(239, 68, 68, 0.12)" } as React.CSSProperties
          }
        >
          <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Failed / Timeout
          </p>
          <p className="text-3xl font-bold text-red-400 tracking-tight">
            {failedTimeout}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden animate-in s5">
        {list.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Task Summary</th>
                  <th>Status</th>
                  <th>Outcome</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {list.map((d) => (
                  <tr key={d.id}>
                    <td className="whitespace-nowrap">
                      <span
                        className="text-rv-subtle text-[12px]"
                        title={formatDate(d.created_at)}
                      >
                        {timeAgo(d.created_at)}
                      </span>
                    </td>
                    <td>
                      <AgentBadge agent={d.from_agent} size="sm" />
                    </td>
                    <td>
                      <AgentBadge agent={d.to_agent} size="sm" />
                    </td>
                    <td>
                      <div className="max-w-sm">
                        <p className="text-rv-text text-[13px] leading-snug">
                          {d.task_summary}
                        </p>
                        {d.task_detail && (
                          <p className="text-rv-subtle text-[12px] mt-0.5 line-clamp-1">
                            {d.task_detail}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${delegationStatusColor(d.status)} bg-current/10`}
                        style={{
                          backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)`,
                        }}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td>
                      <p className="text-rv-subtle text-[12px] max-w-xs truncate">
                        {d.outcome ?? "\u2014"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap text-rv-subtle text-[12px]">
                      {d.completed_at
                        ? formatDuration(d.created_at, d.completed_at)
                        : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rv-muted/30 mb-4">
              <ArrowLeftRight size={22} className="text-rv-subtle/50" />
            </div>
            <p className="text-rv-subtle text-sm font-medium">
              No delegations yet
            </p>
            <p className="text-rv-subtle/60 text-[12px] mt-1 max-w-xs mx-auto">
              Delegations appear here when agents send tasks to each other via
              sessions_send.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
