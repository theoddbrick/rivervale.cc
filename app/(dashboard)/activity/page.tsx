import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { timeAgo, categoryColor, statusColor, formatDate } from "@/lib/utils";
import type { AgentLog } from "@/lib/types";
import { Activity, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

export const revalidate = 30;

interface SearchParams {
  agent?: string;
  category?: string;
  status?: string;
  q?: string;
  page?: string;
}

const PAGE_SIZE = 50;
const CATEGORIES = [
  "Config Change",
  "Decision",
  "Error & Fix",
  "Task",
  "Summary",
  "Reminder",
  "Note",
];
const AGENTS = [
  "\u{1F527} Architect",
  "\u{1F3E0} Housekeeper",
  "\u{1F43C} Panda",
  "\u{1F43B}\u200D\u2744\uFE0F PolarBear",
];

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

  if (params.agent) query = query.eq("agent", params.agent);
  if (params.category) query = query.eq("category", params.category);
  if (params.status) query = query.eq("status", params.status);
  if (params.q) query = query.ilike("title", `%${params.q}%`);

  const { data: logs, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Stats
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const { data: todayStats } = await supabase
    .from("agent_logs")
    .select("agent, category")
    .gte("created_at", oneDayAgo.toISOString());

  const todayList = (todayStats ?? []) as { agent: string; category: string }[];
  const totalToday = todayList.length;
  const agentBreakdown = AGENTS.map((a) => ({
    name: a,
    count: todayList.filter((l) => l.agent === a).length,
  }));

  const hasFilters = params.agent || params.category || params.status || params.q;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <AutoRefresh />
      {/* Header */}
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-rv-accent/[0.12] flex items-center justify-center">
            <Activity size={15} className="text-rv-accent" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Activity</h1>
        </div>
        <p className="text-rv-subtle text-[13px] ml-11">
          Agent audit trail — all significant actions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="card stat-card p-4 col-span-2 md:col-span-1 animate-in s1" style={{ "--stat-glow": "rgba(99, 102, 241, 0.15)" } as React.CSSProperties}>
          <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Today
          </p>
          <p className="text-3xl font-bold text-rv-text tracking-tight">
            {totalToday}
          </p>
          <p className="text-rv-subtle text-[11px] mt-0.5">log entries</p>
        </div>
        {agentBreakdown.map((a, i) => (
          <div
            key={a.name}
            className={`card stat-card p-4 animate-in s${i + 2}`}
          >
            <p className="text-rv-subtle text-[11px] mb-1.5 truncate">
              {a.name}
            </p>
            <p className="text-2xl font-bold text-rv-text tracking-tight">
              {a.count}
            </p>
            <p className="text-rv-subtle text-[11px] mt-0.5">today</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form
        method="GET"
        className="flex flex-wrap items-center gap-2 mb-5 animate-in s5"
      >
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-rv-subtle/60"
          />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search title…"
            className="pl-8 pr-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-[13px] placeholder:text-rv-subtle/40 focus:outline-none focus:border-rv-accent/40 w-44 transition-colors"
          />
        </div>
        <select
          name="agent"
          defaultValue={params.agent ?? ""}
          className="px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-[13px] focus:outline-none focus:border-rv-accent/40 transition-colors"
        >
          <option value="">All agents</option>
          {AGENTS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-[13px] focus:outline-none focus:border-rv-accent/40 transition-colors"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-[13px] focus:outline-none focus:border-rv-accent/40 transition-colors"
        >
          <option value="">All statuses</option>
          <option value="Complete">Complete</option>
          <option value="In Progress">In Progress</option>
          <option value="Blocked">Blocked</option>
        </select>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rv-accent/[0.12] hover:bg-rv-accent/20 text-rv-accent-hover text-[13px] font-medium transition-colors border border-rv-accent/[0.15]"
        >
          <Filter size={13} />
          Filter
        </button>
        {hasFilters && (
          <a
            href="/activity"
            className="px-3 py-1.5 rounded-lg bg-rv-muted/50 hover:bg-rv-muted text-rv-subtle text-[13px] transition-colors"
          >
            Clear
          </a>
        )}
      </form>

      {/* Table */}
      <div className="card overflow-hidden animate-in s6">
        {logs && logs.length > 0 ? (
          <div className="overflow-x-auto">
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
                  <tr key={log.id}>
                    <td className="whitespace-nowrap">
                      <span
                        className="text-rv-subtle text-[12px]"
                        title={formatDate(log.created_at)}
                      >
                        {timeAgo(log.created_at)}
                      </span>
                    </td>
                    <td>
                      <AgentBadge agent={log.agent} size="sm" />
                    </td>
                    <td>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${categoryColor(log.category)}`}
                      >
                        {log.category}
                      </span>
                    </td>
                    <td>
                      <div className="max-w-md">
                        <p className="text-rv-text text-[13px] leading-snug">
                          {log.title}
                        </p>
                        {log.description && (
                          <p className="text-rv-subtle text-[12px] mt-0.5 line-clamp-1">
                            {log.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${statusColor(log.status)}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {log.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-rv-muted/60 text-rv-subtle font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rv-muted/30 mb-4">
              <Activity size={22} className="text-rv-subtle/50" />
            </div>
            <p className="text-rv-subtle text-sm font-medium">
              No activity yet
            </p>
            <p className="text-rv-subtle/60 text-[12px] mt-1 max-w-xs mx-auto">
              Entries appear here as agents log to Supabase via the
              skill.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 animate-in s7">
          <p className="text-rv-subtle text-[12px]">
            {count} entries &middot; page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}${params.agent ? `&agent=${params.agent}` : ""}${params.category ? `&category=${params.category}` : ""}${params.status ? `&status=${params.status}` : ""}${params.q ? `&q=${params.q}` : ""}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg card text-rv-subtle text-[13px] hover:text-rv-text transition-colors"
              >
                <ChevronLeft size={14} />
                Prev
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?page=${page + 1}${params.agent ? `&agent=${params.agent}` : ""}${params.category ? `&category=${params.category}` : ""}${params.status ? `&status=${params.status}` : ""}${params.q ? `&q=${params.q}` : ""}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg card text-rv-subtle text-[13px] hover:text-rv-text transition-colors"
              >
                Next
                <ChevronRight size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
