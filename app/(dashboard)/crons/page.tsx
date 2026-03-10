import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { timeAgo, statusColor, formatDate } from "@/lib/utils";
import type { CronRun } from "@/lib/types";

export const revalidate = 30;

export default async function CronsPage() {
  const supabase = await createClient();

  const { data: runs, count } = await supabase
    .from("cron_runs")
    .select("*", { count: "exact" })
    .order("started_at", { ascending: false })
    .limit(100);

  const total   = count ?? 0;
  const success = (runs as CronRun[] | null)?.filter((r) => r.status === "success").length ?? 0;
  const failed  = (runs as CronRun[] | null)?.filter((r) => r.status === "failed").length ?? 0;
  const running = (runs as CronRun[] | null)?.filter((r) => r.status === "running").length ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-rv-text">Cron Runs</h1>
        <p className="text-rv-subtle text-sm mt-0.5">Execution history for all scheduled jobs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">Total runs</p>
          <p className="text-2xl font-bold text-rv-text">{total}</p>
        </div>
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">Successful</p>
          <p className="text-2xl font-bold text-green-400">{success}</p>
        </div>
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-400">{failed}</p>
        </div>
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">Running</p>
          <p className="text-2xl font-bold text-blue-400">{running}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-rv-surface border border-rv-border rounded-xl overflow-hidden">
        {runs && runs.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Job</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Output</th>
              </tr>
            </thead>
            <tbody>
              {(runs as CronRun[]).map((run) => (
                <tr key={run.id}>
                  <td className="whitespace-nowrap">
                    <span className="text-rv-subtle text-xs" title={formatDate(run.started_at)}>
                      {timeAgo(run.started_at)}
                    </span>
                  </td>
                  <td>
                    <p className="text-rv-text text-sm">{run.job_name ?? run.job_id ?? "—"}</p>
                    {run.job_id && run.job_name && (
                      <p className="text-rv-subtle text-xs font-mono">{run.job_id}</p>
                    )}
                  </td>
                  <td>
                    {run.agent ? <AgentBadge agent={run.agent} size="sm" /> : <span className="text-rv-subtle text-xs">—</span>}
                  </td>
                  <td>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColor(run.status ?? "")}`}>
                      {run.status ?? "—"}
                    </span>
                  </td>
                  <td className="text-rv-subtle text-xs">
                    {run.duration_ms != null
                      ? run.duration_ms > 60000
                        ? `${(run.duration_ms / 60000).toFixed(1)}m`
                        : `${(run.duration_ms / 1000).toFixed(1)}s`
                      : run.finished_at
                      ? `${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                      : "—"}
                  </td>
                  <td className="max-w-xs">
                    {run.error ? (
                      <p className="text-red-400 text-xs line-clamp-2 font-mono">{run.error}</p>
                    ) : run.output ? (
                      <p className="text-rv-subtle text-xs line-clamp-2 font-mono">{run.output}</p>
                    ) : (
                      <span className="text-rv-subtle/40 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-rv-subtle">
            <p className="text-4xl mb-3">⏰</p>
            <p className="text-sm">No cron runs logged yet.</p>
            <p className="text-xs mt-1">Agents use <code className="font-mono">supabase cron-run start/finish</code> to log here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
