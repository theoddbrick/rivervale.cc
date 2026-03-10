-- Migration 003: Deny anonymous access to all tables
-- Applied: 2026-03-10
-- Security fix: block anon role from reading/writing all dashboard data

CREATE POLICY "Deny anon read agent_logs" ON agent_logs FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon read tasks" ON tasks FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert tasks" ON tasks FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update tasks" ON tasks FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon read config_changes" ON config_changes FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon read cron_runs" ON cron_runs FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon read system_health" ON system_health FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon read heartbeats" ON heartbeats FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon read delegations" ON delegations FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon read commands" ON dashboard_commands FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert commands" ON dashboard_commands FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update commands" ON dashboard_commands FOR UPDATE TO anon USING (false);
