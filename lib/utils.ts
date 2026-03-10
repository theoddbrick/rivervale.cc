import { formatDistanceToNow, format } from "date-fns";

export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d, yyyy HH:mm");
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), "MMM d");
}

// Agent display name → short slug for CSS classes
export function agentSlug(agent: string): string {
  if (agent.includes("Housekeeper")) return "housekeeper";
  if (agent.includes("Panda")) return "panda";
  if (agent.includes("PolarBear") || agent.includes("Polar")) return "polarbear";
  if (agent.includes("Architect")) return "architect";
  return "unknown";
}

export function agentColor(agent: string): string {
  const slug = agentSlug(agent);
  const colors: Record<string, string> = {
    housekeeper: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    panda:       "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    polarbear:   "text-blue-400 bg-blue-400/10 border-blue-400/20",
    architect:   "text-violet-400 bg-violet-400/10 border-violet-400/20",
    unknown:     "text-slate-400 bg-slate-400/10 border-slate-400/20",
  };
  return colors[slug] ?? colors.unknown;
}

export function categoryColor(category: string): string {
  const colors: Record<string, string> = {
    "Config Change": "text-orange-400 bg-orange-400/10",
    "Decision":      "text-cyan-400 bg-cyan-400/10",
    "Error & Fix":   "text-red-400 bg-red-400/10",
    "Task":          "text-green-400 bg-green-400/10",
    "Summary":       "text-blue-400 bg-blue-400/10",
    "Reminder":      "text-yellow-400 bg-yellow-400/10",
    "Note":          "text-slate-400 bg-slate-400/10",
  };
  return colors[category] ?? "text-slate-400 bg-slate-400/10";
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    "Complete":    "text-green-400 bg-green-400/10",
    "In Progress": "text-yellow-400 bg-yellow-400/10",
    "Blocked":     "text-red-400 bg-red-400/10",
    "todo":        "text-slate-400 bg-slate-400/10",
    "in_progress": "text-yellow-400 bg-yellow-400/10",
    "done":        "text-green-400 bg-green-400/10",
    "blocked":     "text-red-400 bg-red-400/10",
    "cancelled":   "text-slate-500 bg-slate-500/10 line-through",
    "success":     "text-green-400 bg-green-400/10",
    "failed":      "text-red-400 bg-red-400/10",
    "running":     "text-blue-400 bg-blue-400/10 animate-pulse",
    "ok":          "text-green-400 bg-green-400/10",
    "warning":     "text-yellow-400 bg-yellow-400/10",
    "error":       "text-red-400 bg-red-400/10",
  };
  return colors[status] ?? "text-slate-400 bg-slate-400/10";
}

export function priorityColor(priority: string): string {
  const colors: Record<string, string> = {
    urgent: "text-red-400",
    high:   "text-orange-400",
    normal: "text-slate-400",
    low:    "text-slate-500",
  };
  return colors[priority] ?? "text-slate-400";
}
