import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { timeAgo, statusColor, formatDate } from "@/lib/utils";
import type { CronRun } from "@/lib/types";
import { Clock, Play, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const revalidate = 30;

export default async function CronsPage() {
  const supabase = await createClient();

  const { data: runs, count } = await supabase
    .from("cron_runs")
    .select("*", { count: "exact" })
    .order("started_at", { ascending: false })
    .limit(100);

  const total = count ?? 0;
  const runsList = (runs as CronRun[] | null) ?? [];
  const success = runsList.filter((r) => r.status === "success").length;
  const failed = runsList.filter((r) => r.status === "failed").length;
  const running = runsList.filter((r) => r.status === "running").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <AutoRefresh />
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/[0.12] flex items-center justify-center">
            <Clock size={15} className="text-cyan-400" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Cron Runs</h1>
        </div>
        <p className="text-rv-subtle text-[13px] ml-11">
          Execution history for all scheduled jobs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="card stat-card p-4 animate-in s1" style={{ "--stat-glow": "rgba(99, 102, 241, 0.12)" } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-1.5">
            <Play size={11} className="text-rv-subtle" />
            <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium">
              Total
            </p>
          </div>
          <p className="text-3xl font-bold text-rv-text tracking-tight">
            {total}
          </p>
        </div>
        <div className="card stat-card p-4 animate-in s2" style={{ "--stat-glow": "rgba(34, 197, 94, 0.15)" } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 size={11} className="text-green-400" />
            <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium">
              Success
            </p>
          </div>
          <p className="text-3xl font-bold text-green-400 tracking-tight">
            {success}
          </p>
        </div>
        <div className="card stat-card p-4 animate-in s3" style={{ "--stat-glow": "rgba(239, 68, 68, 0.12)" } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-1.5">
            <XCircle size={11} className="text-red-400" />
            <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium">
              Failed
            </p>
          </div>
          <p className="text-3xl font-bold text-red-400 tracking-tight">
            {failed}
          </p>
        </div>
        <div className="card stat-card p-4 animate-in s4" style={{ "--stat-glow": "rgba(59, 130, 246, 0.12)" } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-1.5">
            <Loader2 size={11} className="text-blue-400" />
            <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium">
              Running
            </p>
          </div>
          <p className="text-3xl font-bold text-blue-400 tracking-tight">
            {running}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden animate-in s5">
        {runsList.length > 0 ? (
          <div className="overflow-x-auto">
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
                {runsList.map((run) => (
                  <tr key={run.id}>
                    <td className="whitespace-nowrap">
                      <span
                        className="text-rv-subtle text-[12px]"
                        title={formatDate(run.started_at)}
                      >
                        {timeAgo(run.started_at)}
                      </span>
                    </td>
                    <td>
                      <p className="text-rv-text text-[13px] font-medium">
                        {run.job_name ?? run.job_id ?? "\u2014"}
                      </p>
                      {run.job_id && run.job_name && (
                        <p className="text-rv-subtle text-[11px] font-mono">
                          {run.job_id}
                        </p>
                      )}
                    </td>
                    <td>
                      {run.agent ? (
                        <AgentBadge agent={run.agent} size="sm" />
                      ) : (
                        <span className="text-rv-subtle/40 text-[12px]">
                          \u2014
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${statusColor(run.status ?? "")}`}
                      >
                        {run.status ?? "\u2014"}
                      </span>
                    </td>
                    <td className="text-rv-subtle text-[12px] font-mono">
                      {run.duration_ms != null
                        ? run.duration_ms > 60000
                          ? `${(run.duration_ms / 60000).toFixed(1)}m`
                          : `${(run.duration_ms / 1000).toFixed(1)}s`
                        : run.finished_at
                          ? `${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                          : "\u2014"}
                    </td>
                    <td className="max-w-xs">
                      {run.error ? (
                        <p className="text-red-400 text-[12px] line-clamp-2 font-mono">
                          {run.error}
                        </p>
                      ) : run.output ? (
                        <p className="text-rv-subtle text-[12px] line-clamp-2 font-mono">
                          {run.output}
                        </p>
                      ) : (
                        <span className="text-rv-subtle/30 text-[12px]">
                          \u2014
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rv-muted/30 mb-4">
              <Clock size={22} className="text-rv-subtle/50" />
            </div>
            <p className="text-rv-subtle text-sm font-medium">
              No cron runs logged yet
            </p>
            <p className="text-rv-subtle/60 text-[12px] mt-1 max-w-xs mx-auto">
              Agents use{" "}
              <code className="font-mono text-rv-subtle/80">
                supabase cron-run
              </code>{" "}
              to log here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
