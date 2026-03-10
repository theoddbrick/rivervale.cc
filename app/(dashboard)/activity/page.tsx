import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { timeAgo, categoryColor, statusColor, formatDate } from "@/lib/utils";
import type { AgentLog } from "@/lib/types";

export const revalidate = 30; // refresh every 30s

interface SearchParams {
  agent?: string;
  category?: string;
  status?: string;
  q?: string;
  page?: string;
}

const PAGE_SIZE = 50;
const CATEGORIES = ["Config Change", "Decision", "Error & Fix", "Task", "Summary", "Reminder", "Note"];
const AGENTS = ["🔧 Architect", "🏠 Housekeeper", "🐼 Panda", "🐻‍❄️ PolarBear"];

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  let query = supabase
    .from("agent_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (params.agent)    query = query.eq("agent", params.agent);
  if (params.category) query = query.eq("category", params.category);
  if (params.status)   query = query.eq("status", params.status);
  if (params.q)        query = query.ilike("title", `%${params.q}%`);

  const { data: logs, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Stats cards
  const { data: todayStats } = await supabase
    .from("agent_logs")
    .select("agent, category")
    .gte("created_at", new Date(Date.now() - 86400000).toISOString());

  const totalToday = todayStats?.length ?? 0;
  const agentBreakdown = AGENTS.map((a) => ({
    name: a,
    count: todayStats?.filter((l) => l.agent === a).length ?? 0,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-rv-text">Activity</h1>
        <p className="text-rv-subtle text-sm mt-0.5">Agent audit trail — all significant actions</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4 col-span-2 md:col-span-1">
          <p className="text-rv-subtle text-xs mb-1">Today</p>
          <p className="text-2xl font-bold text-rv-text">{totalToday}</p>
          <p className="text-rv-subtle text-xs mt-0.5">log entries</p>
        </div>
        {agentBreakdown.map((a) => (
          <div key={a.name} className="bg-rv-surface border border-rv-border rounded-xl p-4">
            <p className="text-rv-subtle text-xs mb-1 truncate">{a.name}</p>
            <p className="text-xl font-bold text-rv-text">{a.count}</p>
            <p className="text-rv-subtle text-xs mt-0.5">today</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-2 mb-4">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search title…"
          className="px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-sm placeholder:text-rv-subtle/50 focus:outline-none focus:border-rv-accent/60 w-44"
        />
        <select
          name="agent"
          defaultValue={params.agent ?? ""}
          className="px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-sm focus:outline-none focus:border-rv-accent/60"
        >
          <option value="">All agents</option>
          {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-sm focus:outline-none focus:border-rv-accent/60"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-sm focus:outline-none focus:border-rv-accent/60"
        >
          <option value="">All statuses</option>
          <option value="Complete">Complete</option>
          <option value="In Progress">In Progress</option>
          <option value="Blocked">Blocked</option>
        </select>
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg bg-rv-accent hover:bg-rv-accent-hover text-white text-sm transition-colors"
        >
          Filter
        </button>
        {(params.agent || params.category || params.status || params.q) && (
          <a
            href="/activity"
            className="px-3 py-1.5 rounded-lg bg-rv-muted hover:bg-rv-border text-rv-subtle text-sm transition-colors"
          >
            Clear
          </a>
        )}
      </form>

      {/* Table */}
      <div className="bg-rv-surface border border-rv-border rounded-xl overflow-hidden">
        {logs && logs.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Agent</th>
                <th>Category</th>
                <th>Title</th>
                <th>Status</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {(logs as AgentLog[]).map((log) => (
                <tr key={log.id} className="group">
                  <td className="whitespace-nowrap">
                    <span
                      className="text-rv-subtle text-xs"
                      title={formatDate(log.created_at)}
                    >
                      {timeAgo(log.created_at)}
                    </span>
                  </td>
                  <td>
                    <AgentBadge agent={log.agent} size="sm" />
                  </td>
                  <td>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${categoryColor(log.category)}`}>
                      {log.category}
                    </span>
                  </td>
                  <td>
                    <div>
                      <p className="text-rv-text text-sm">{log.title}</p>
                      {log.description && (
                        <p className="text-rv-subtle text-xs mt-0.5 line-clamp-1">{log.description}</p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {log.tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-rv-muted text-rv-subtle">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-rv-subtle">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">No activity yet.</p>
            <p className="text-xs mt-1">Entries appear here as agents log to Supabase.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-rv-subtle text-xs">
            {count} total entries · page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}${params.agent ? `&agent=${params.agent}` : ""}${params.category ? `&category=${params.category}` : ""}`}
                className="px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-subtle text-sm hover:text-rv-text transition-colors"
              >
                ← Prev
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?page=${page + 1}${params.agent ? `&agent=${params.agent}` : ""}${params.category ? `&category=${params.category}` : ""}`}
                className="px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-subtle text-sm hover:text-rv-text transition-colors"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
