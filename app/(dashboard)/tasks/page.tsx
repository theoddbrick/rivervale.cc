import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { timeAgo, priorityColor, formatDate } from "@/lib/utils";
import type { Task } from "@/lib/types";

export const revalidate = 30;

const COLUMNS: { key: Task["status"]; label: string; color: string }[] = [
  { key: "todo",        label: "To Do",      color: "text-slate-400 border-slate-400/30" },
  { key: "in_progress", label: "In Progress", color: "text-yellow-400 border-yellow-400/30" },
  { key: "blocked",     label: "Blocked",    color: "text-red-400 border-red-400/30" },
  { key: "done",        label: "Done",       color: "text-green-400 border-green-400/30" },
];

export default async function TasksPage() {
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .not("status", "eq", "cancelled")
    .order("created_at", { ascending: false });

  const byStatus = (status: Task["status"]) =>
    (tasks as Task[] | null)?.filter((t) => t.status === status) ?? [];

  const total     = tasks?.length ?? 0;
  const inProgress = byStatus("in_progress").length;
  const blocked    = byStatus("blocked").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-rv-text">Tasks</h1>
        <p className="text-rv-subtle text-sm mt-0.5">Agent task board — created and tracked by agents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">Total open</p>
          <p className="text-2xl font-bold text-rv-text">{total}</p>
        </div>
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">In progress</p>
          <p className="text-2xl font-bold text-yellow-400">{inProgress}</p>
        </div>
        <div className="bg-rv-surface border border-rv-border rounded-xl p-4">
          <p className="text-rv-subtle text-xs mb-1">Blocked</p>
          <p className="text-2xl font-bold text-red-400">{blocked}</p>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(({ key, label, color }) => {
          const columnTasks = byStatus(key);
          return (
            <div key={key} className="bg-rv-surface border border-rv-border rounded-xl overflow-hidden">
              {/* Column header */}
              <div className={`px-4 py-3 border-b border-rv-border flex items-center justify-between`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${color.split(" ")[0]}`}>
                  {label}
                </span>
                <span className="text-xs text-rv-subtle bg-rv-muted rounded-full px-2 py-0.5">
                  {columnTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-2 min-h-[120px]">
                {columnTasks.length === 0 ? (
                  <p className="text-rv-subtle/40 text-xs text-center py-6">Empty</p>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-rv-bg border border-rv-border rounded-lg p-3 hover:border-rv-muted transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-rv-text text-sm font-medium leading-snug">{task.title}</p>
                        <span className={`text-xs shrink-0 ${priorityColor(task.priority)}`}>
                          {task.priority === "urgent" ? "🔴" : task.priority === "high" ? "🟠" : task.priority === "low" ? "⚪" : "⚫"}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-rv-subtle text-xs line-clamp-2 mb-2">{task.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <AgentBadge agent={task.agent} size="sm" />
                        <span
                          className="text-rv-subtle/60 text-xs"
                          title={formatDate(task.created_at)}
                        >
                          {timeAgo(task.created_at)}
                        </span>
                      </div>

                      {task.due_at && (
                        <p className="text-xs text-amber-400/70 mt-1.5">
                          Due {timeAgo(task.due_at)}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
