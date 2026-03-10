# Rivervale — OpenClaw Dashboard

Live dashboard for the Rivervale household AI operations. Deployed to Vercel, backed by Supabase.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — dark theme
- **Supabase** — database + auth (`nsnylufmqvensxxbwhcq`)

## Pages

| Route | Purpose |
|-------|---------|
| `/activity` | Agent audit trail (all `supabase log` entries) |
| `/tasks` | Kanban task board |
| `/agents` | Per-agent status and recent activity |
| `/crons` | Cron run history |
| `/config` | Config change audit trail |
| `/health` | System health checks over time |

## Deploy to Vercel

1. Import `https://github.com/theoddbrick/rivervale.cc` in Vercel
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://nsnylufmqvensxxbwhcq.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from `.env.local`)
3. Deploy

## Local Development

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Database

Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor once.

## Supabase Auth Setup

In Supabase Dashboard → Authentication → Users → Invite User:
- Add your email, set password

## Agent Skill

The Pi agents write to Supabase via `~/.openclaw/skills/supabase/supabase` (bash CLI).
Uses `SUPABASE_SERVICE_ROLE_KEY` from `~/.openclaw/.env`.

```bash
supabase log Architect "Config Change" "Title" "Description" Complete
supabase task create Panda "Do something" "Description" high
supabase health Architect gateway ok
```

## Architect Access

Local repo: `~/Projects/rivervale.cc/`
Architect has full read/write access (`fs.workspaceOnly: false`).
To push changes: `cd ~/Projects/rivervale.cc && git add -A && git commit -m "..." && git push`
