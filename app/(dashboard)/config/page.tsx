import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { timeAgo, statusColor, formatDate } from "@/lib/utils";
import type { ConfigChange } from "@/lib/types";
import { Settings, GitBranch, RotateCcw, AlertTriangle } from "lucide-react";

export const revalidate = 30;

export default async function ConfigPage() {
  const supabase = await createClient();

  const { data: changes, count } = await supabase
    .from("config_changes")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(100);

  const changesList = (changes as ConfigChange[] | null) ?? [];
  const total = count ?? 0;
  const rolledBack = changesList.filter(
    (c) => c.status === "rolled-back"
  ).length;
  const failed = changesList.filter((c) => c.status === "failed").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-orange-500/[0.12] flex items-center justify-center">
            <Settings size={15} className="text-orange-400" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Config Changes
          </h1>
        </div>
        <p className="text-rv-subtle text-[13px] ml-11">
          Full audit trail of every openclaw.json modification
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="card stat-card p-4 animate-in s1" style={{ "--stat-glow": "rgba(99, 102, 241, 0.12)" } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-1.5">
            <GitBranch size={11} className="text-rv-subtle" />
            <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium">
              Total changes
            </p>
          </div>
          <p className="text-3xl font-bold text-rv-text tracking-tight">
            {total}
          </p>
        </div>
        <div className="card stat-card p-4 animate-in s2" style={{ "--stat-glow": "rgba(245, 158, 11, 0.15)" } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-1.5">
            <RotateCcw size={11} className="text-amber-400" />
            <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium">
              Rolled back
            </p>
          </div>
          <p className="text-3xl font-bold text-amber-400 tracking-tight">
            {rolledBack}
          </p>
        </div>
        <div className="card stat-card p-4 animate-in s3" style={{ "--stat-glow": "rgba(239, 68, 68, 0.12)" } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle size={11} className="text-red-400" />
            <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium">
              Failed
            </p>
          </div>
          <p className="text-3xl font-bold text-red-400 tracking-tight">
            {failed}
          </p>
        </div>
      </div>

      {/* Changes list */}
      <div className="space-y-3">
        {changesList.length > 0 ? (
          changesList.map((change, i) => (
            <div
              key={change.id}
              className={`card card-hover p-5 animate-in s${Math.min(i + 4, 8)}`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AgentBadge agent={change.agent} size="sm" />
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${statusColor(change.status)}`}
                    >
                      {change.status}
                    </span>
                  </div>
                  <p className="text-rv-text text-[14px] font-medium leading-snug">
                    {change.summary}
                  </p>
                </div>
                <span
                  className="text-rv-subtle/60 text-[12px] whitespace-nowrap shrink-0"
                  title={formatDate(change.created_at)}
                >
                  {timeAgo(change.created_at)}
                </span>
              </div>

              {change.rationale && (
                <p className="text-rv-subtle text-[13px] mb-2 leading-relaxed">
                  {change.rationale}
                </p>
              )}

              {change.patch_applied && (
                <details className="mt-3 group">
                  <summary className="text-rv-subtle/50 text-[12px] cursor-pointer hover:text-rv-subtle transition-colors font-medium">
                    <span className="group-open:hidden">View patch →</span>
                    <span className="hidden group-open:inline">
                      Hide patch ↑
                    </span>
                  </summary>
                  <pre className="mt-2 p-4 bg-rv-bg/80 rounded-xl border border-rv-border/40 text-[12px] text-rv-subtle font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {change.patch_applied}
                  </pre>
                </details>
              )}
            </div>
          ))
        ) : (
          <div className="card py-20 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rv-muted/30 mb-4">
              <Settings size={22} className="text-rv-subtle/50" />
            </div>
            <p className="text-rv-subtle text-sm font-medium">
              No config changes recorded yet
            </p>
            <p className="text-rv-subtle/60 text-[12px] mt-1 max-w-xs mx-auto">
              Agents use{" "}
              <code className="font-mono text-rv-subtle/80">
                supabase config-change
              </code>{" "}
              to log here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
