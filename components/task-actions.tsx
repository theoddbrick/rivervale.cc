"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AgentName, TaskPriority, TaskStatus } from "@/lib/types";
import { Plus, X } from "lucide-react";

const AGENTS: { label: string; value: AgentName }[] = [
  { label: "Housekeeper", value: "\u{1F3E0} Housekeeper" },
  { label: "Panda", value: "\u{1F43C} Panda" },
  { label: "PolarBear", value: "\u{1F43B}\u200D\u2744\uFE0F PolarBear" },
  { label: "Architect", value: "\u{1F527} Architect" },
];

const PRIORITIES: { label: string; value: TaskPriority }[] = [
  { label: "Low", value: "low" },
  { label: "Normal", value: "normal" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const STATUSES: { label: string; value: TaskStatus }[] = [
  { label: "To Do", value: "todo" },
  { label: "In Progress", value: "in_progress" },
  { label: "Blocked", value: "blocked" },
  { label: "Done", value: "done" },
  { label: "Cancelled", value: "cancelled" },
];

export function TaskActions() {
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState<AgentName>(AGENTS[0].value);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("tasks").insert({
        agent,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: "todo" as TaskStatus,
        due_at: dueAt || null,
        tags: [],
        metadata: {},
      } as never);
      if (error) throw error;
      setTitle("");
      setDescription("");
      setPriority("normal");
      setDueAt("");
      setOpen(false);
      setFeedback("Task created");
      setTimeout(() => setFeedback(null), 2000);
      router.refresh();
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Failed to create task"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rv-accent/[0.12] hover:bg-rv-accent/20 text-rv-accent-hover text-[13px] font-medium transition-colors border border-rv-accent/[0.15]"
        >
          {open ? <X size={13} /> : <Plus size={13} />}
          {open ? "Cancel" : "New Task"}
        </button>
        {feedback && (
          <span className="text-emerald-400 text-[12px] font-medium animate-in">
            {feedback}
          </span>
        )}
      </div>

      {open && (
        <div className="card p-5 mt-3 animate-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1 block">
                Agent
              </label>
              <select
                value={agent}
                onChange={(e) => setAgent(e.target.value as AgentName)}
                className="w-full px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-[13px] focus:outline-none focus:border-rv-accent/40 transition-colors"
              >
                {AGENTS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1 block">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-[13px] focus:outline-none focus:border-rv-accent/40 transition-colors"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1 block">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-[13px] placeholder:text-rv-subtle/40 focus:outline-none focus:border-rv-accent/40 transition-colors"
            />
          </div>
          <div className="mb-3">
            <label className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-[13px] placeholder:text-rv-subtle/40 focus:outline-none focus:border-rv-accent/40 transition-colors resize-none"
            />
          </div>
          <div className="mb-4">
            <label className="text-rv-subtle text-[11px] uppercase tracking-wider font-medium mb-1 block">
              Due date (optional)
            </label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-[13px] focus:outline-none focus:border-rv-accent/40 transition-colors"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rv-accent/[0.12] hover:bg-rv-accent/20 text-rv-accent-hover text-[13px] font-medium transition-colors border border-rv-accent/[0.15] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={13} />
            {saving ? "Creating..." : "Create Task"}
          </button>
        </div>
      )}
    </div>
  );
}

export function TaskStatusSelect({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: TaskStatus;
}) {
  const [status, setStatus] = useState<TaskStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleChange = async (newStatus: TaskStatus) => {
    setStatus(newStatus);
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus } as never)
        .eq("id", taskId);
      if (error) throw error;
      router.refresh();
    } catch {
      setStatus(currentStatus);
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as TaskStatus)}
      disabled={saving}
      className={`px-1.5 py-0.5 rounded-md bg-rv-surface border border-rv-border text-[10px] text-rv-text focus:outline-none focus:border-rv-accent/40 transition-colors disabled:opacity-50 ${saving ? "animate-pulse" : ""}`}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
