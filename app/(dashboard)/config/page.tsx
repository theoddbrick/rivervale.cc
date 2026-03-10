import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { timeAgo, statusColor, formatDate } from "@/lib/utils";
import type { ConfigChange } from "@/lib/types";

export const revalidate = 30;

export default async function ConfigPage() {
  const supabase = await createClient();

  const { data: changes, count } = await supabase
    .from("config_changes")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(100);

  const total       = count ?? 0;
  const rolledBack  = (changes as ConfigChange[] | null)?.filter((c) => c.status === "rolled-back").length ?? 0;
  const failed      = (changes as ConfigChange[] | null)?.filter((c) => c.status === "failed").length ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-rv-text">Config Changes</h1>
        <p className="text-rv-subtle text-sm mt-0.5">Full audit trail of every openclaw.json modification</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">Total changes</p>
          <p className="text-2xl font-bold text-rv-text">{total}</p>
        </div>
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">Rolled back</p>
          <p className="text-2xl font-bold text-amber-400">{rolledBack}</p>
        </div>
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-400">{failed}</p>
        </div>
      </div>

      {/* Changes list */}
      <div className="space-y-3">
        {changes && changes.length > 0 ? (
          (changes as ConfigChange[]).map((change) => (
            <div key={change.id} className="bg-rv-surface border border-rv-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AgentBadge agent={change.agent} size="sm" />
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColor(change.status)}`}>
                      {change.status}
                    </span>
                  </div>
                  <p className="text-rv-text text-sm font-medium">{change.summary}</p>
                </div>
                <span className="text-rv-subtle text-xs whitespace-nowrap" title={formatDate(change.created_at)}>
                  {timeAgo(change.created_at)}
                </span>
              </div>

              {change.rationale && (
                <p className="text-rv-subtle text-xs mb-2">{change.rationale}</p>
              )}

              {change.patch_applied && (
                <details className="mt-2">
                  <summary className="text-rv-subtle/60 text-xs cursor-pointer hover:text-rv-subtle">
                    View patch →
                  </summary>
                  <pre className="mt-2 p-3 bg-rv-bg rounded-lg border border-rv-border/50 text-xs text-rv-subtle font-mono overflow-x-auto whitespace-pre-wrap">
                    {change.patch_applied}
                  </pre>
                </details>
              )}
            </div>
          ))
        ) : (
          <div className="bg-rv-surface border border-rv-border rounded-xl py-16 text-center text-rv-subtle">
            <p className="text-4xl mb-3">⚙️</p>
            <p className="text-sm">No config changes recorded yet.</p>
            <p className="text-xs mt-1">
              Agents use <code className="font-mono">supabase config-change</code> to log here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
