import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { CommandCenter } from "@/components/command-center";
import {
  timeAgo,
  formatDate,
  commandStatusColor,
  commandTypeLabel,
} from "@/lib/utils";
import type { DashboardCommand } from "@/lib/types";
import { Terminal } from "lucide-react";

export const revalidate = 30;

export default async function CommandsPage() {
  const supabase = await createClient();

  const { data: commands } = await supabase
    .from("dashboard_commands")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const list = (commands as DashboardCommand[] | null) ?? [];

  const total = list.length;
  const pending = list.filter((c) => c.status === "pending").length;
  const completed = list.filter((c) => c.status === "completed").length;
  const failed = list.filter((c) => c.status === "failed").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <AutoRefresh />
      {/* Header */}
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-rv-accent/[0.12] flex items-center justify-center">
            <Terminal size={15} className="text-rv-accent" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Commands</h1>
        </div>
        <p className="text-rv-subtle text-[13px] ml-11">
          Send commands and view execution history
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
            {
              "--stat-glow": "rgba(234, 179, 8, 0.15)",
            } as React.CSSProperties
          }
        >
          <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Pending
          </p>
          <p className="text-3xl font-bold text-yellow-400 tracking-tight">
            {pending}
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
            Failed
          </p>
          <p className="text-3xl font-bold text-red-400 tracking-tight">
            {failed}
          </p>
        </div>
      </div>

      {/* Command Center */}
      <div className="mb-8 animate-in s5">
        <CommandCenter />
      </div>

      {/* Command History */}
      <div className="card overflow-hidden animate-in s6">
        <div className="px-5 py-3 border-b border-rv-border/60">
          <p className="text-rv-subtle text-[11px] font-semibold uppercase tracking-wider">
            Command History
          </p>
        </div>
        {list.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Result / Error</th>
                </tr>
              </thead>
              <tbody>
                {list.map((cmd) => (
                  <tr key={cmd.id}>
                    <td className="whitespace-nowrap">
                      <span
                        className="text-rv-subtle text-[12px]"
                        title={formatDate(cmd.created_at)}
                      >
                        {timeAgo(cmd.created_at)}
                      </span>
                    </td>
                    <td>
                      <span className="text-[11px] px-2 py-0.5 rounded-md font-medium text-rv-text bg-rv-muted/50">
                        {commandTypeLabel(cmd.command_type)}
                      </span>
                    </td>
                    <td>
                      {cmd.target_agent ? (
                        <AgentBadge agent={cmd.target_agent} size="sm" />
                      ) : (
                        <span className="text-rv-subtle/40 text-[12px]">
                          system
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${commandStatusColor(cmd.status)}`}
                        style={{
                          backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)`,
                        }}
                      >
                        {cmd.status}
                      </span>
                    </td>
                    <td className="text-rv-subtle text-[12px] max-w-xs truncate font-mono">
                      {cmd.error ? (
                        <span className="text-red-400">{cmd.error}</span>
                      ) : cmd.result ? (
                        cmd.result
                      ) : (
                        "\u2014"
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
              <Terminal size={22} className="text-rv-subtle/50" />
            </div>
            <p className="text-rv-subtle text-sm font-medium">
              No commands sent yet
            </p>
            <p className="text-rv-subtle/60 text-[12px] mt-1 max-w-xs mx-auto">
              Use the command center above to send commands to agents or the
              system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
