-- Migration 002: Heartbeats, Delegations, Dashboard Commands
-- Applied: 2026-03-10

-- Heartbeats: agent liveness tracking
CREATE TABLE IF NOT EXISTS heartbeats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    agent TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ok',
    context_pct NUMERIC(5,1),
    session_active BOOLEAN DEFAULT true,
    details JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_heartbeats_checked_at ON heartbeats (checked_at DESC);
CREATE INDEX idx_heartbeats_agent ON heartbeats (agent);

-- Delegations: inter-agent communication tracking
CREATE TABLE IF NOT EXISTS delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    task_summary TEXT NOT NULL,
    task_detail TEXT,
    status TEXT NOT NULL DEFAULT 'sent',
    outcome TEXT,
    follow_up TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_delegations_created_at ON delegations (created_at DESC);
CREATE INDEX idx_delegations_status ON delegations (status);
CREATE INDEX idx_delegations_from ON delegations (from_agent);
CREATE INDEX idx_delegations_to ON delegations (to_agent);

-- Dashboard Commands: command queue for interactive features
CREATE TABLE IF NOT EXISTS dashboard_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    executed_at TIMESTAMPTZ,
    command_type TEXT NOT NULL,
    target_agent TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending',
    result TEXT,
    error TEXT
);

CREATE INDEX idx_commands_status ON dashboard_commands (status);
CREATE INDEX idx_commands_created_at ON dashboard_commands (created_at DESC);

-- RLS for new tables
ALTER TABLE heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_commands ENABLE ROW LEVEL SECURITY;

-- Authenticated users: read all, write commands
CREATE POLICY "Authenticated read heartbeats" ON heartbeats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read delegations" ON delegations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read commands" ON dashboard_commands FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert commands" ON dashboard_commands FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update commands" ON dashboard_commands FOR UPDATE TO authenticated USING (true);
