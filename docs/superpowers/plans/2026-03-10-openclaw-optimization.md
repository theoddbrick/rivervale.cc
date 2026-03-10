# OpenClaw Optimization + Interactive Dashboard

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the OpenClaw setup into a fully Supabase-integrated system with near-real-time interactive dashboard, proper agent delegation patterns, and comprehensive oversight.

**Architecture:** Supabase serves as the single source of truth for all agent operations. The dashboard polls Supabase every 10s for near-real-time updates. Interactive features use a command queue pattern: dashboard writes commands to Supabase, a Pi-side systemd poller executes them via OpenClaw CLI and writes results back. Agent instructions are updated to log heartbeats, delegations, and structured escalations to Supabase.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Supabase (PostgREST + RLS), Bash (skill CLI + poller), systemd, OpenClaw CLI/gateway API.

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `supabase/migrations/002_new_tables.sql` | 3 new tables: heartbeats, delegations, dashboard_commands |
| `hooks/use-auto-refresh.ts` | Client hook that calls router.refresh() every N seconds |
| `components/auto-refresh.tsx` | Client wrapper component using the hook |
| `components/task-actions.tsx` | Client component for task create/edit/complete |
| `components/command-center.tsx` | Client component for sending commands to agents |
| `app/(dashboard)/delegations/page.tsx` | Delegation tracking page |
| `app/(dashboard)/commands/page.tsx` | Command center + history page |
| `~/.openclaw/scripts/dashboard-poller.sh` | Pi-side script polling dashboard_commands |
| `/etc/systemd/system/openclaw-dashboard-poller.service` | systemd unit for poller |

### Modified Files
| File | Changes |
|------|---------|
| `~/.openclaw/skills/supabase/supabase` | Add heartbeat, delegation, delegation-complete commands |
| `lib/types.ts` | Add Heartbeat, Delegation, DashboardCommand types |
| `lib/utils.ts` | Add commandStatusColor, delegationStatusColor helpers |
| `components/sidebar.tsx` | Add Delegations + Commands nav items |
| `app/(dashboard)/activity/page.tsx` | Add auto-refresh |
| `app/(dashboard)/agents/page.tsx` | Add heartbeat data, auto-refresh |
| `app/(dashboard)/tasks/page.tsx` | Add interactive task management, auto-refresh |
| `app/(dashboard)/crons/page.tsx` | Add auto-refresh |
| `app/(dashboard)/health/page.tsx` | Add auto-refresh |
| `app/(dashboard)/config/page.tsx` | Add auto-refresh |
| `~/.openclaw/workspace-housekeeper/AGENTS.md` | Fix timeout bug, add delegation logging, oversight protocol |
| `~/.openclaw/workspace-housekeeper/HEARTBEAT.md` | Add Supabase heartbeat logging |
| `~/.openclaw/workspace-architect/AGENTS.md` | Add technical escalation intake protocol |
| `~/.openclaw/workspace-architect/HEARTBEAT.md` | Add Supabase heartbeat logging |
| `~/.openclaw/workspace-panda/AGENTS.md` | Add structured Architect escalation, delegation logging |
| `~/.openclaw/workspace-panda/HEARTBEAT.md` | Add Supabase heartbeat logging |
| `~/.openclaw/workspace-polarbear/AGENTS.md` | Add structured Architect escalation, delegation logging |
| `~/.openclaw/workspace-polarbear/HEARTBEAT.md` | Add Supabase heartbeat logging |

---

## Chunk 1: Schema + Supabase Skill Foundation

### Task 1.1: New Supabase Tables

**Files:**
- Create: `supabase/migrations/002_new_tables.sql`

- [ ] **Step 1: Write migration SQL**

```sql
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
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Run the SQL via `mcp__plugin_supabase_supabase__execute_sql`.

- [ ] **Step 3: Verify tables exist**

Query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`

### Task 1.2: Upgrade Supabase Skill

**Files:**
- Modify: `~/.openclaw/skills/supabase/supabase`

- [ ] **Step 1: Add heartbeat command**

After the `cmd_health()` function (~line 293), add:

```bash
# ---------------------------------------------------------------------------
# heartbeat: Log agent heartbeat result
# Usage: supabase heartbeat <agent> <ok|warning|error> [context_pct] [details_json]
# ---------------------------------------------------------------------------
cmd_heartbeat() {
    local agent="$1" status="${2:-ok}" context_pct="${3:-}" details="${4:-{}}"

    if [[ -z "$agent" ]]; then
        echo -e "${RED}Usage: supabase heartbeat <agent> <ok|warning|error> [context_pct] [details_json]${NC}" >&2
        exit 1
    fi

    local payload
    if [[ -n "$context_pct" ]]; then
        payload=$(jq -n \
            --arg agent     "$(agent_label "$agent")" \
            --arg status    "$status" \
            --argjson ctx   "$context_pct" \
            --argjson details "$details" \
            '{agent:$agent, status:$status, context_pct:$ctx, session_active:true, details:$details}')
    else
        payload=$(jq -n \
            --arg agent     "$(agent_label "$agent")" \
            --arg status    "$status" \
            --argjson details "$details" \
            '{agent:$agent, status:$status, session_active:true, details:$details}')
    fi

    local resp
    resp=$(sb_post "heartbeats" "$payload")

    if echo "$resp" | jq -e '.[0].id // .id' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Heartbeat: ${status}${NC}"
    else
        echo -e "${RED}✗ Heartbeat failed${NC}" >&2; echo "$resp" | jq . >&2; exit 1
    fi
}
```

- [ ] **Step 2: Add delegation command**

```bash
# ---------------------------------------------------------------------------
# delegation: Log an inter-agent delegation
# Usage: supabase delegation <from_agent> <to_agent> <task_summary> [task_detail]
# Returns: delegation ID (for completing later)
# ---------------------------------------------------------------------------
cmd_delegation() {
    local from="$1" to="$2" summary="$3" detail="${4:-}"

    if [[ -z "$from" || -z "$to" || -z "$summary" ]]; then
        echo -e "${RED}Usage: supabase delegation <from> <to> <task_summary> [detail]${NC}" >&2
        exit 1
    fi

    local payload
    payload=$(jq -n \
        --arg from    "$(agent_label "$from")" \
        --arg to      "$(agent_label "$to")" \
        --arg summary "$summary" \
        --arg detail  "$detail" \
        '{from_agent:$from, to_agent:$to, task_summary:$summary, task_detail:$detail, status:"sent"}')

    local resp
    resp=$(sb_post "delegations" "$payload")
    local id
    id=$(echo "$resp" | jq -r '.[0].id // .id // empty')

    if [[ -n "$id" ]]; then
        echo -e "${GREEN}✓ Delegation logged${NC}"
        echo "  ID: $id"
    else
        echo -e "${RED}✗ Failed${NC}" >&2; echo "$resp" | jq . >&2; exit 1
    fi
}
```

- [ ] **Step 3: Add delegation-complete command**

```bash
# ---------------------------------------------------------------------------
# delegation-complete: Mark a delegation as completed
# Usage: supabase delegation-complete <id> <success|failed|partial> [outcome] [follow_up]
# ---------------------------------------------------------------------------
cmd_delegation_complete() {
    local id="$1" status="$2" outcome="${3:-}" follow_up="${4:-}"

    if [[ -z "$id" || -z "$status" ]]; then
        echo -e "${RED}Usage: supabase delegation-complete <id> <success|failed|partial> [outcome] [follow_up]${NC}" >&2
        exit 1
    fi

    local patch
    patch=$(jq -n \
        --arg status    "$status" \
        --arg outcome   "$outcome" \
        --arg follow_up "$follow_up" \
        --arg completed "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        '{status:$status, outcome:$outcome, follow_up:$follow_up, completed_at:$completed}')

    sb_patch "delegations" "id=eq.${id}" "$patch" > /dev/null
    echo -e "${GREEN}✓ Delegation ${id:0:8}… → ${status}${NC}"
}
```

- [ ] **Step 4: Add pending-commands query for poller**

```bash
# ---------------------------------------------------------------------------
# pending-commands: List pending dashboard commands (used by poller)
# Usage: supabase pending-commands
# ---------------------------------------------------------------------------
cmd_pending_commands() {
    local resp
    resp=$(sb_get "dashboard_commands?status=eq.pending&order=created_at.asc&limit=10")
    echo "$resp"
}

# ---------------------------------------------------------------------------
# command-result: Write result back to a dashboard command
# Usage: supabase command-result <id> <completed|failed> [result] [error]
# ---------------------------------------------------------------------------
cmd_command_result() {
    local id="$1" status="$2" result="${3:-}" error="${4:-}"

    local patch
    patch=$(jq -n \
        --arg status   "$status" \
        --arg result   "$result" \
        --arg error    "$error" \
        --arg executed "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        '{status:$status, result:$result, error:$error, executed_at:$executed}')

    sb_patch "dashboard_commands" "id=eq.${id}" "$patch" > /dev/null
    echo -e "${GREEN}✓ Command ${id:0:8}… → ${status}${NC}"
}
```

- [ ] **Step 5: Update main dispatcher**

Add new cases to the main `case` statement:

```bash
    heartbeat)              shift; cmd_heartbeat "$@" ;;
    delegation)             shift; cmd_delegation "$@" ;;
    delegation-complete)    shift; cmd_delegation_complete "$@" ;;
    pending-commands)       cmd_pending_commands ;;
    command-result)         shift; cmd_command_result "$@" ;;
```

- [ ] **Step 6: Update help text**

Add to the help block:

```
  heartbeat <agent> <ok|warning|error> [context_pct] [details_json]
      Record agent heartbeat for dashboard liveness tracking.

  delegation <from_agent> <to_agent> <task_summary> [task_detail]
      Log an inter-agent delegation. Returns ID for completion tracking.

  delegation-complete <id> <success|failed|partial> [outcome] [follow_up]
      Mark a delegation as completed with outcome.

  pending-commands
      List pending dashboard commands (used by Pi poller).

  command-result <id> <completed|failed> [result] [error]
      Write execution result back to a dashboard command.
```

- [ ] **Step 7: Test the new commands**

```bash
supabase heartbeat Architect ok 45.2 '{"gateway":"healthy","agents_online":4}'
supabase delegation Panda Architect "Fix cron schedule" "The daily health cron is failing"
supabase pending-commands
```

### Task 1.3: Update Dashboard Types

**Files:**
- Modify: `~/Projects/rivervale.cc/lib/types.ts`

- [ ] **Step 1: Add new type definitions**

Append after existing types:

```typescript
export interface Heartbeat {
  id: string
  checked_at: string
  agent: AgentName
  status: 'ok' | 'warning' | 'error'
  context_pct: number | null
  session_active: boolean
  details: Record<string, unknown>
}

export type DelegationStatus = 'sent' | 'acknowledged' | 'success' | 'failed' | 'partial' | 'timeout'

export interface Delegation {
  id: string
  created_at: string
  completed_at: string | null
  from_agent: AgentName
  to_agent: AgentName
  task_summary: string
  task_detail: string | null
  status: DelegationStatus
  outcome: string | null
  follow_up: string | null
  metadata: Record<string, unknown>
}

export type CommandType = 'message_agent' | 'trigger_healthcheck' | 'restart_gateway' | 'run_doctor' | 'sync_crons' | 'force_heartbeat'
export type CommandStatus = 'pending' | 'executing' | 'completed' | 'failed'

export interface DashboardCommand {
  id: string
  created_at: string
  executed_at: string | null
  command_type: CommandType
  target_agent: AgentName | null
  payload: Record<string, unknown>
  status: CommandStatus
  result: string | null
  error: string | null
}
```

- [ ] **Step 2: Update Database interface**

Add to the Database interface's Tables section:

```typescript
heartbeats: {
  Row: Heartbeat
  Insert: Omit<Heartbeat, 'id' | 'checked_at'>
  Update: Partial<Omit<Heartbeat, 'id'>>
}
delegations: {
  Row: Delegation
  Insert: Omit<Delegation, 'id' | 'created_at'>
  Update: Partial<Omit<Delegation, 'id'>>
}
dashboard_commands: {
  Row: DashboardCommand
  Insert: Omit<DashboardCommand, 'id' | 'created_at'>
  Update: Partial<Omit<DashboardCommand, 'id'>>
}
```

---

## Chunk 2: Pi Command Poller

### Task 2.1: Create Poller Script

**Files:**
- Create: `~/.openclaw/scripts/dashboard-poller.sh`

- [ ] **Step 1: Write the poller script**

```bash
#!/bin/bash
# Dashboard Command Poller
# Polls Supabase dashboard_commands table for pending commands
# Executes them via OpenClaw CLI and writes results back
set -euo pipefail

SKILL_DIR="$HOME/.openclaw/skills/supabase"
SUPABASE="$SKILL_DIR/supabase"
LOG_FILE="$HOME/.openclaw/logs/dashboard-poller.log"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" >> "$LOG_FILE"; }

# Source env
if [[ -f "$HOME/.openclaw/.env" ]]; then
    set -a; source "$HOME/.openclaw/.env"; set +a
fi

process_command() {
    local id="$1" cmd_type="$2" target="$3" payload="$4"
    local result="" error="" status="completed"

    log "Processing: $id ($cmd_type → $target)"

    # Mark as executing
    "$SUPABASE" command-result "$id" "executing" "" "" 2>/dev/null || true

    case "$cmd_type" in
        message_agent)
            local message
            message=$(echo "$payload" | jq -r '.message // empty')
            local agent_id
            agent_id=$(echo "$target" | tr '[:upper:]' '[:lower:]' | sed 's/🔧 //;s/🏠 //;s/🐼 //;s/🐻‍❄️ //')
            if [[ -n "$message" && -n "$agent_id" ]]; then
                result=$(openclaw gateway call sessions.send --params "{\"sessionKey\":\"agent:${agent_id}:main\",\"message\":\"[Dashboard] ${message}\",\"timeoutSeconds\":30}" 2>&1) || {
                    error="$result"; status="failed"
                }
            else
                error="Missing message or agent"; status="failed"
            fi
            ;;
        trigger_healthcheck)
            local agent_id
            agent_id=$(echo "$target" | tr '[:upper:]' '[:lower:]' | sed 's/🔧 //;s/🏠 //;s/🐼 //;s/🐻‍❄️ //')
            result=$(openclaw gateway call sessions.send --params "{\"sessionKey\":\"agent:${agent_id}:main\",\"message\":\"SYSTEM: Run health check and report to Supabase immediately.\",\"timeoutSeconds\":30}" 2>&1) || {
                error="$result"; status="failed"
            }
            ;;
        restart_gateway)
            result=$(openclaw gateway restart 2>&1) || {
                error="$result"; status="failed"
            }
            ;;
        run_doctor)
            result=$(openclaw doctor 2>&1 | head -50) || {
                error="$result"; status="failed"
            }
            ;;
        force_heartbeat)
            local agent_id
            agent_id=$(echo "$target" | tr '[:upper:]' '[:lower:]' | sed 's/🔧 //;s/🏠 //;s/🐼 //;s/🐻‍❄️ //')
            result=$(openclaw gateway call agentTurn --params "{\"agentId\":\"${agent_id}\",\"sessionTarget\":\"isolated\",\"systemEvent\":\"HEARTBEAT: Run your heartbeat checks now and log to Supabase.\"}" 2>&1) || {
                error="$result"; status="failed"
            }
            ;;
        sync_crons)
            result=$(openclaw cron list 2>&1 | head -80) || {
                error="$result"; status="failed"
            }
            ;;
        *)
            error="Unknown command type: $cmd_type"; status="failed"
            ;;
    esac

    # Truncate long results
    result="${result:0:2000}"
    error="${error:0:2000}"

    "$SUPABASE" command-result "$id" "$status" "$result" "$error" 2>/dev/null || log "Failed to write result for $id"
    log "Done: $id → $status"
}

# Main loop
log "Poller started"
while true; do
    pending=$("$SUPABASE" pending-commands 2>/dev/null || echo "[]")

    if echo "$pending" | jq -e 'length > 0' > /dev/null 2>&1; then
        echo "$pending" | jq -c '.[]' | while read -r cmd; do
            id=$(echo "$cmd" | jq -r '.id')
            cmd_type=$(echo "$cmd" | jq -r '.command_type')
            target=$(echo "$cmd" | jq -r '.target_agent // empty')
            payload=$(echo "$cmd" | jq -c '.payload // {}')
            process_command "$id" "$cmd_type" "$target" "$payload" &
        done
        wait
    fi

    sleep 5
done
```

- [ ] **Step 2: Make executable**

```bash
chmod +x ~/.openclaw/scripts/dashboard-poller.sh
```

- [ ] **Step 3: Create systemd service**

```ini
[Unit]
Description=OpenClaw Dashboard Command Poller
After=network.target

[Service]
Type=simple
User=josephtsao
ExecStart=/home/josephtsao/.openclaw/scripts/dashboard-poller.sh
Restart=always
RestartSec=10
Environment=HOME=/home/josephtsao
EnvironmentFile=/home/josephtsao/.openclaw/.env

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 4: Enable and start the service**

```bash
sudo systemctl daemon-reload
sudo systemctl enable openclaw-dashboard-poller
sudo systemctl start openclaw-dashboard-poller
sudo systemctl status openclaw-dashboard-poller
```

- [ ] **Step 5: Verify poller is running**

```bash
journalctl -u openclaw-dashboard-poller -n 10
cat ~/.openclaw/logs/dashboard-poller.log
```

---

## Chunk 3: Dashboard Real-time + Interactive Features

### Task 3.1: Auto-Refresh Infrastructure

**Files:**
- Create: `~/Projects/rivervale.cc/hooks/use-auto-refresh.ts`
- Create: `~/Projects/rivervale.cc/components/auto-refresh.tsx`

- [ ] **Step 1: Create useAutoRefresh hook**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAutoRefresh(intervalMs: number = 10000) {
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh()
    }, intervalMs)

    return () => clearInterval(timer)
  }, [router, intervalMs])
}
```

- [ ] **Step 2: Create AutoRefresh wrapper component**

```typescript
'use client'

import { useAutoRefresh } from '@/hooks/use-auto-refresh'

export function AutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  useAutoRefresh(intervalMs)
  return null
}
```

- [ ] **Step 3: Add AutoRefresh to all 6 existing dashboard pages**

Insert `<AutoRefresh />` at the top of each page's return JSX (activity, agents, tasks, crons, config, health). Since AutoRefresh is a client component rendered inside a server component, it just triggers router.refresh() which re-fetches server component data.

### Task 3.2: Interactive Task Management

**Files:**
- Create: `~/Projects/rivervale.cc/components/task-actions.tsx`
- Modify: `~/Projects/rivervale.cc/app/(dashboard)/tasks/page.tsx`

- [ ] **Step 1: Create TaskActions client component**

Component with:
- "New Task" button that opens an inline form (agent dropdown, title, description, priority, optional due date)
- Per-task "Complete" button on each task card
- Per-task status dropdown (todo, in_progress, blocked, done)
- All writes go directly to Supabase via client (RLS allows INSERT/UPDATE for authenticated)

- [ ] **Step 2: Update tasks page to include TaskActions**

Import and render `<TaskActions />` in the tasks page header area. Add `<AutoRefresh />` for live updates.

### Task 3.3: Command Center Page

**Files:**
- Create: `~/Projects/rivervale.cc/app/(dashboard)/commands/page.tsx`
- Create: `~/Projects/rivervale.cc/components/command-center.tsx`

- [ ] **Step 1: Create CommandCenter client component**

Features:
- **Message Agent** form: agent dropdown + message textarea → inserts `message_agent` command
- **Quick Actions** grid: buttons for Restart Gateway, Run Doctor, Sync Crons, Force Heartbeat (per agent)
- **Trigger Health Check** per agent
- All buttons insert rows into `dashboard_commands` table via Supabase client
- Status indicator shows pending/executing/completed/failed with live updates

- [ ] **Step 2: Create Commands page (server + client)**

Server component fetches recent command history from `dashboard_commands` (last 50). Renders CommandCenter component + command history table showing: time, type, target, status, result/error.

### Task 3.4: Delegations Page

**Files:**
- Create: `~/Projects/rivervale.cc/app/(dashboard)/delegations/page.tsx`

- [ ] **Step 1: Create delegations page**

Server component that:
- Fetches from `delegations` table ordered by created_at desc
- Stats: Total, Active (sent/acknowledged), Completed, Failed/Timeout
- Table: time, from→to (agent badges), task summary, status badge, outcome, duration (completed_at - created_at)
- Filter by from_agent, to_agent, status
- `<AutoRefresh />` for live updates

### Task 3.5: Enhanced Agents Page

**Files:**
- Modify: `~/Projects/rivervale.cc/app/(dashboard)/agents/page.tsx`

- [ ] **Step 1: Add heartbeat data**

Query `heartbeats` table for latest heartbeat per agent. Display:
- Last heartbeat time with "X minutes ago"
- Context fill percentage with color-coded bar (green <60%, yellow 60-80%, red >80%)
- Session active indicator (pulsing green dot vs grey dot)
- Heartbeat trend: count of heartbeats in last 24h

### Task 3.6: Update Sidebar

**Files:**
- Modify: `~/Projects/rivervale.cc/components/sidebar.tsx`

- [ ] **Step 1: Add new navigation items**

Add to the nav array after "Health":
```typescript
{ name: 'Delegations', href: '/delegations', icon: ArrowLeftRight },
{ name: 'Commands', href: '/commands', icon: Terminal },
```

Import `ArrowLeftRight` and `Terminal` from lucide-react.

---

## Chunk 4: Agent Instructions Overhaul

### Task 4.1: Fix Housekeeper Bugs + Add Protocols

**Files:**
- Modify: `~/.openclaw/workspace-housekeeper/AGENTS.md`
- Modify: `~/.openclaw/workspace-housekeeper/HEARTBEAT.md`

- [ ] **Step 1: Fix timeoutSeconds: 300 → 60**

In the Agent Communication section (~line 110-119), change:
```javascript
// OLD (line 116):
timeoutSeconds: 300
// NEW:
timeoutSeconds: 60  // NEVER 300 — causes session lane deadlock
```

- [ ] **Step 2: Add structured delegation logging protocol**

After the Delegation Completion Protocol section, add:

```markdown
## 📊 Delegation Logging to Supabase (mandatory)

Every inter-agent delegation MUST be logged to Supabase for dashboard visibility.

### When delegating TO another agent:
\`\`\`bash
# Before sending sessions_send, log the delegation:
supabase delegation Housekeeper <target-agent> "<task summary>" "<detail>"
# Save the returned ID for completion tracking
\`\`\`

### When receiving a delegation completion report:
\`\`\`bash
# On receiving TASK COMPLETE from another agent:
supabase delegation-complete <delegation-id> <success|failed|partial> "<outcome>" "<follow-up>"
\`\`\`

### When delegating technical issues to Architect:
Use this structured format for sessions_send:
\`\`\`
TECHNICAL ESCALATION — <priority: routine|urgent>
Issue: <one-line summary>
Context: <what happened, what was tried>
Impact: <who/what is affected>
Requested: <what Architect should do>
Delegation ID: <supabase delegation id>
\`\`\`

This ensures Architect receives structured intake, and the dashboard tracks the delegation lifecycle.
```

- [ ] **Step 3: Add Housekeeper oversight feed protocol**

After the Dashboard Self-Governance section, add:

```markdown
## 📡 Oversight Feed (integrated into heartbeat)

At every heartbeat, in addition to existing checks, query Supabase for oversight:

\`\`\`bash
# Check for new delegations in last 30 minutes
supabase query "" "" 5   # recent logs
# Check for stale delegations (sent >2h ago, not completed)
# Check for failed commands from dashboard
\`\`\`

This ensures you have full visibility into what all agents are doing, even between direct communications.
```

- [ ] **Step 4: Update HEARTBEAT.md to log heartbeat to Supabase**

Add at the END of the heartbeat routine (before the response section):

```markdown
## Supabase Heartbeat (mandatory, every heartbeat)

After completing all checks above, log your heartbeat:

\`\`\`bash
supabase heartbeat Housekeeper <ok|warning|error> [context_fill_%] '{"agents_checked":true,"gateway":"ok"}'
\`\`\`

This makes your heartbeat visible in the dashboard. Never skip this — even if everything is OK.
```

### Task 4.2: Add Architect Technical Escalation Protocol

**Files:**
- Modify: `~/.openclaw/workspace-architect/AGENTS.md`
- Modify: `~/.openclaw/workspace-architect/HEARTBEAT.md`

- [ ] **Step 1: Add structured escalation intake**

After the IT Ticketing section, add:

```markdown
## 🔧 Technical Escalation Intake

You receive technical escalations from Panda, PolarBear, or Housekeeper. These arrive as:

\`\`\`
TECHNICAL ESCALATION — <priority>
Issue: ...
Context: ...
Impact: ...
Requested: ...
Delegation ID: <id>
\`\`\`

### On receipt:
1. Acknowledge immediately in your response
2. Log to Supabase: \`supabase log Architect Task "Escalation: <issue>" "<context>" "In Progress"\`
3. Investigate and resolve using your standard protocols
4. On completion, report back to delegator AND log completion:
   \`\`\`bash
   supabase delegation-complete <delegation-id> success "<what was done>" "<follow-up>"
   supabase log Architect Task "Resolved: <issue>" "<what was done>" Complete
   \`\`\`
5. Always CC Housekeeper on resolution (brief sessions_send, timeoutSeconds: 10)

### Standing technical domains (auto-accept, no Joseph approval needed):
- OpenClaw config issues (schema violations, restart failures)
- Skill installation/debugging
- Cron job management
- Gateway health issues
- Agent workspace file issues
- Dashboard/Supabase connectivity
```

- [ ] **Step 2: Update HEARTBEAT.md to log heartbeat to Supabase**

Add before the Reply section:

```markdown
### 9. Supabase Heartbeat (mandatory)

Log heartbeat status to Supabase for dashboard visibility:
\`\`\`bash
supabase heartbeat Architect <ok|warning|error> [context_fill_%] '{"orphaned_subagents":0,"gateway":"ok"}'
\`\`\`
```

### Task 4.3: Update Panda + PolarBear

**Files:**
- Modify: `~/.openclaw/workspace-panda/AGENTS.md`
- Modify: `~/.openclaw/workspace-panda/HEARTBEAT.md`
- Modify: `~/.openclaw/workspace-polarbear/AGENTS.md`
- Modify: `~/.openclaw/workspace-polarbear/HEARTBEAT.md`

- [ ] **Step 1: Add delegation logging to Panda AGENTS.md**

After the Delegation Completion Protocol section, add:

```markdown
## 📊 Delegation Logging to Supabase

When delegating to another agent, log it:
\`\`\`bash
supabase delegation Panda <target-agent> "<task summary>" "<detail>"
# Save the ID — pass it in your sessions_send so the target can complete it
\`\`\`

When receiving completion:
\`\`\`bash
supabase delegation-complete <id> <success|failed|partial> "<outcome>" "<follow-up>"
\`\`\`
```

- [ ] **Step 2: Add structured Architect escalation to Panda**

Update the Escalation Paths table and add below it:

```markdown
### Structured Escalation to Architect

When escalating technical issues to Architect, use this format:
\`\`\`bash
# 1. Log delegation to Supabase first
supabase delegation Panda Architect "<issue summary>" "<detail>"
# 2. Send structured escalation
sessions_send({
  sessionKey: "agent:architect:main",
  message: "TECHNICAL ESCALATION — routine\nIssue: <summary>\nContext: <what happened>\nImpact: <who is affected>\nRequested: <what to do>\nDelegation ID: <id from step 1>",
  timeoutSeconds: 60
})
```

- [ ] **Step 3: Add heartbeat logging to Panda HEARTBEAT.md**

Add at the end:

```markdown
## Supabase Heartbeat (mandatory)

After checks, log heartbeat:
\`\`\`bash
supabase heartbeat Panda ok
\`\`\`
```

- [ ] **Step 4: Repeat steps 1-3 for PolarBear**

Same changes, replacing "Panda" with "PolarBear" and "Joseph" references with "Grace".

---

## Chunk 5: Cron Cleanup + Config Fixes

### Task 5.1: Delete Orphaned Crons

- [ ] **Step 1: Delete 8 orphaned probation review crons for retired agents**

```bash
openclaw cron delete 11a59624    # ace-phase1-oversight
openclaw cron delete 0a9a99f6    # probation-review-prospect
openclaw cron delete 21962ab9    # Probation Review: Ace
openclaw cron delete 291bc1ed    # probation-review-ledger
openclaw cron delete 39b98900    # probation-review-redpen
openclaw cron delete 8fef7f88    # probation-review-scribe
openclaw cron delete f7951ff9    # probation-review-quill
openclaw cron delete 8d388fa0    # probation-review-sentinel
```

- [ ] **Step 2: Investigate architect-daily-health error**

```bash
openclaw cron get 06e4df7e
```

Check the error, fix the root cause.

- [ ] **Step 3: Verify remaining crons are correct**

```bash
openclaw cron list
```

Should show: architect-daily-health (fixed), Weekly Token Health Check, Weekly HR Summary, Quarterly IT Audit, Quarterly HR Review, Probation Review: Architect — 6 crons total.

### Task 5.2: Config Fixes

- [ ] **Step 1: Fix gateway.trustedProxies**

This requires the safe config change pipeline (backup → patch → validate). Add Tailscale IP to trustedProxies.

Note: This change must go through `gateway config.patch` — NOT direct file edit. Use Architect's pre/post config change scripts.

- [ ] **Step 2: Log all changes to Supabase**

```bash
supabase config-change Architect "Cleaned up 8 orphaned crons" "Retired agents (sentinel, ace, quill, scribe, redpen, prospect, ledger) had active crons wasting agent turns" "" applied
supabase config-change Architect "Fixed gateway.trustedProxies" "Added Tailscale IP for clean proxy header logging" '{"gateway.trustedProxies":["127.0.0.1","100.77.152.96"]}' applied
supabase log Architect Task "System optimization complete" "Cleaned orphaned crons, fixed config, updated agent instructions" Complete "maintenance,optimization"
```

---

## Execution Order

1. **Chunk 1** first (schema + skill) — everything depends on this
2. **Chunk 5** next (cron cleanup + config fixes) — independent, quick wins
3. **Chunk 2** (Pi poller) — needed before interactive dashboard features
4. **Chunk 4** (agent instructions) — can run in parallel with Chunk 3
5. **Chunk 3** (dashboard) — depends on schema and poller being ready
