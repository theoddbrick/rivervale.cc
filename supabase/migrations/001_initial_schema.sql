-- =============================================================================
-- OpenClaw Dashboard — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================================================
-- agent_logs: Replaces Notion "Household AI Ops" database
-- All agents write here for every significant action
-- =============================================================================
create table if not exists agent_logs (
    id          uuid        default gen_random_uuid() primary key,
    created_at  timestamptz default now() not null,
    agent       text        not null,  -- housekeeper | panda | polarbear | architect
    category    text        not null,  -- Config Change | Decision | Error & Fix | Task | Summary | Reminder | Note
    title       text        not null,
    description text,
    status      text        default 'Complete', -- Complete | In Progress | Blocked
    tags        text[]      default '{}',
    metadata    jsonb       default '{}'
);

-- =============================================================================
-- tasks: Proper task tracking (replaces Panda/PolarBear's Projects & Tasks pages)
-- =============================================================================
create table if not exists tasks (
    id          uuid        default gen_random_uuid() primary key,
    created_at  timestamptz default now() not null,
    updated_at  timestamptz default now() not null,
    agent       text        not null,  -- agent that owns this task
    title       text        not null,
    description text,
    status      text        default 'todo', -- todo | in_progress | done | blocked | cancelled
    priority    text        default 'normal', -- low | normal | high | urgent
    due_at      timestamptz,
    tags        text[]      default '{}',
    metadata    jsonb       default '{}'
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger tasks_updated_at
    before update on tasks
    for each row execute function update_updated_at();

-- =============================================================================
-- config_changes: Replaces Architect's Config History page
-- Stores full diff for every openclaw.json change
-- =============================================================================
create table if not exists config_changes (
    id             uuid        default gen_random_uuid() primary key,
    created_at     timestamptz default now() not null,
    agent          text        not null,
    summary        text        not null,
    rationale      text,
    patch_applied  text,       -- the gateway config.patch value used
    status         text        default 'applied', -- applied | rolled-back | failed
    metadata       jsonb       default '{}'
);

-- =============================================================================
-- cron_runs: Execution history for all cron jobs
-- =============================================================================
create table if not exists cron_runs (
    id           uuid        default gen_random_uuid() primary key,
    started_at   timestamptz default now() not null,
    finished_at  timestamptz,
    job_id       text,
    job_name     text,
    agent        text,
    status       text,        -- running | success | failed
    output       text,
    error        text,
    duration_ms  integer
);

-- =============================================================================
-- system_health: Health check results over time
-- =============================================================================
create table if not exists system_health (
    id          uuid        default gen_random_uuid() primary key,
    checked_at  timestamptz default now() not null,
    agent       text,
    component   text,        -- gateway | models | telegram | memory | disk | network
    status      text,        -- ok | warning | error
    details     jsonb        default '{}'
);

-- =============================================================================
-- Indexes for common dashboard queries
-- =============================================================================
create index if not exists idx_agent_logs_created_at  on agent_logs(created_at desc);
create index if not exists idx_agent_logs_agent        on agent_logs(agent);
create index if not exists idx_agent_logs_category     on agent_logs(category);
create index if not exists idx_agent_logs_status       on agent_logs(status);
create index if not exists idx_tasks_agent             on tasks(agent);
create index if not exists idx_tasks_status            on tasks(status);
create index if not exists idx_config_changes_created  on config_changes(created_at desc);
create index if not exists idx_cron_runs_started       on cron_runs(started_at desc);
create index if not exists idx_system_health_checked   on system_health(checked_at desc);

-- =============================================================================
-- Row Level Security
-- Authenticated users (dashboard): SELECT only
-- service_role (Pi skill): bypasses RLS by default — can INSERT/UPDATE/DELETE
-- =============================================================================
alter table agent_logs    enable row level security;
alter table tasks         enable row level security;
alter table config_changes enable row level security;
alter table cron_runs     enable row level security;
alter table system_health enable row level security;

-- Read policies for authenticated users (dashboard login)
create policy "auth read agent_logs"     on agent_logs     for select to authenticated using (true);
create policy "auth read tasks"          on tasks          for select to authenticated using (true);
create policy "auth read config_changes" on config_changes for select to authenticated using (true);
create policy "auth read cron_runs"      on cron_runs      for select to authenticated using (true);
create policy "auth read system_health"  on system_health  for select to authenticated using (true);

-- Write policies for authenticated users (dashboard can update task status)
create policy "auth update tasks" on tasks for update to authenticated using (true) with check (true);
create policy "auth insert tasks" on tasks for insert to authenticated with check (true);
