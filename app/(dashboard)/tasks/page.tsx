import { createClient } from "@/lib/supabase/server";
import { AgentBadge } from "@/components/agent-badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { timeAgo, priorityColor, formatDate } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { CheckSquare, Circle, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { TaskActions, TaskStatusSelect } from "@/components/task-actions";

export const revalidate = 30;

const COLUMNS: {
  key: Task["status"];
  label: string;
  accent: string;
  icon: typeof Circle;
}[] = [
  { key: "todo", label: "To Do", accent: "text-slate-400 border-slate-400/20", icon: Circle },
  { key: "in_progress", label: "In Progress", accent: "text-yellow-400 border-yellow-400/20", icon: Loader2 },
  { key: "blocked", label: "Blocked", accent: "text-red-400 border-red-400/20", icon: AlertTriangle },
  { key: "done", label: "Done", accent: "text-emerald-400 border-emerald-400/20", icon: CheckCircle2 },
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

  const total = tasks?.length ?? 0;
  const inProgress = byStatus("in_progress").length;
  const blocked = byStatus("blocked").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <AutoRefresh />
      {/* Header */}
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/[0.12] flex items-center justify-center">
            <CheckSquare size={15} className="text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
        </div>
        <p className="text-rv-subtle text-[13px] ml-11">
          Agent task board — created and tracked by agents
        </p>
      </div>

      {/* New Task */}
      <TaskActions />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="card stat-card p-4 animate-in s1" style={{ "--stat-glow": "rgba(99, 102, 241, 0.12)" } as React.CSSProperties}>
          <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Total open
          </p>
          <p className="text-3xl font-bold text-rv-text tracking-tight">
            {total}
          </p>
        </div>
        <div className="card stat-card p-4 animate-in s2" style={{ "--stat-glow": "rgba(234, 179, 8, 0.15)" } as React.CSSProperties}>
          <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1.5">
            In progress
          </p>
          <p className="text-3xl font-bold text-yellow-400 tracking-tight">
            {inProgress}
          </p>
        </div>
        <div className="card stat-card p-4 animate-in s3" style={{ "--stat-glow": "rgba(239, 68, 68, 0.12)" } as React.CSSProperties}>
          <p className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Blocked
          </p>
          <p className="text-3xl font-bold text-red-400 tracking-tight">
            {blocked}
          </p>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(({ key, label, accent, icon: Icon }, colIdx) => {
          const columnTasks = byStatus(key);
          return (
            <div
              key={key}
              className={`card overflow-hidden animate-in s${colIdx + 4}`}
            >
              {/* Column header */}
              <div className="px-4 py-3 border-b border-rv-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon
                    size={13}
                    className={accent.split(" ")[0]}
                  />
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${accent.split(" ")[0]}`}
                  >
                    {label}
                  </span>
                </div>
                <span className="text-[11px] text-rv-subtle bg-rv-muted/50 rounded-full px-2 py-0.5 font-medium">
                  {columnTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-2 min-h-[140px]">
                {columnTasks.length === 0 ? (
                  <p className="text-rv-subtle/30 text-[12px] text-center py-8">
                    No tasks
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-rv-bg/80 border border-rv-border/60 rounded-xl p-3.5 card-hover"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-rv-text text-[13px] font-medium leading-snug">
                          {task.title}
                        </p>
                        <span
                          className={`text-[11px] shrink-0 ${priorityColor(task.priority)}`}
                        >
                          {task.priority === "urgent"
                            ? "\u{1F534}"
                            : task.priority === "high"
                              ? "\u{1F7E0}"
                              : task.priority === "low"
                                ? "\u26AA"
                                : "\u26AB"}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-rv-subtle text-[12px] line-clamp-2 mb-2.5 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <AgentBadge agent={task.agent} size="sm" />
                        <div className="flex items-center gap-2">
                          <TaskStatusSelect
                            taskId={task.id}
                            currentStatus={task.status}
                          />
                          <span
                            className="text-rv-subtle/50 text-[11px]"
                            title={formatDate(task.created_at)}
                          >
                            {timeAgo(task.created_at)}
                          </span>
                        </div>
                      </div>

                      {task.due_at && (
                        <p className="text-[11px] text-amber-400/70 mt-2 font-medium">
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
