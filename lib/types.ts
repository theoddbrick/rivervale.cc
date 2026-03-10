// Database types derived from schema.sql
// These mirror the Supabase tables exactly

export type AgentName = "🔧 Architect" | "🏠 Housekeeper" | "🐼 Panda" | "🐻‍❄️ PolarBear";
export type LogCategory = "Config Change" | "Decision" | "Error & Fix" | "Task" | "Summary" | "Reminder" | "Note";
export type LogStatus = "Complete" | "In Progress" | "Blocked";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type HealthStatus = "ok" | "warning" | "error";

export interface AgentLog {
  id: string;
  created_at: string;
  agent: string;
  category: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Task {
  id: string;
  created_at: string;
  updated_at: string;
  agent: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ConfigChange {
  id: string;
  created_at: string;
  agent: string;
  summary: string;
  rationale: string | null;
  patch_applied: string | null;
  status: string;
  metadata: Record<string, unknown>;
}

export interface CronRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  job_id: string | null;
  job_name: string | null;
  agent: string | null;
  status: string | null;
  output: string | null;
  error: string | null;
  duration_ms: number | null;
}

export interface SystemHealth {
  id: string;
  checked_at: string;
  agent: string | null;
  component: string | null;
  status: string | null;
  details: Record<string, unknown>;
}

// Supabase database shape (for typed client)
export interface Database {
  public: {
    Tables: {
      agent_logs: {
        Row: AgentLog;
        Insert: Omit<AgentLog, "id" | "created_at">;
        Update: Partial<Omit<AgentLog, "id" | "created_at">>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Task, "id" | "created_at">>;
      };
      config_changes: {
        Row: ConfigChange;
        Insert: Omit<ConfigChange, "id" | "created_at">;
        Update: Partial<Omit<ConfigChange, "id" | "created_at">>;
      };
      cron_runs: {
        Row: CronRun;
        Insert: Omit<CronRun, "id">;
        Update: Partial<Omit<CronRun, "id">>;
      };
      system_health: {
        Row: SystemHealth;
        Insert: Omit<SystemHealth, "id">;
        Update: Partial<Omit<SystemHealth, "id">>;
      };
    };
  };
}
