# Activity Log — «لاگ فعالیت» (who did what, and when)

ژاله's standing order (2026-11-02): the admin panel must always show **who did
what, and when**. This file is the rulebook for that system.

## Where the log lives

- **Store:** `activity-log.json` in this repo (deployed with the site). It was
  seeded on 2026-11-02; entries recorded after the fact are marked
  «ثبت پسینی» in their detail — never backdate silently.
- **Display:** `admin.html` → tab **«🕘 لاگ فعالیت / Activity Log»** — newest
  first, times shown in Toronto time.
- A staging copy also sits in `~/workspace/zhiolearns-deploy-site/`; the helper
  below keeps the two copies in sync.

## ⭐ Standing rule for every agent / program that changes this site

After **any** site change or deploy (article, printable, game, spotlight,
shop item, CSS, anything), append exactly one entry, in the same work session:

```bash
python3 ~/workspace/zhiolearns-site/tools/log_activity.py \
  --actor "Muse — برنامه روزانه" \
  --action "افزودن مقاله + انتشار" \
  --target "for-parents-example.html" \
  --detail "توضیح کوتاه فارسی" \
  --commit <git hash, if committed>
```

Actor names: `ژاله` (the owner, manual changes), `Muse` (main agent),
`Muse — برنامه روزانه` (the daily program), `system` (automatic events).

## Actions inside the admin panel

`admin.html` logs by itself: login, content add/edit/delete, activate/deactivate,
site-text edits, series-settings saves, article add/edit/delete. In-panel entries
are kept in the browser's local storage on the admin's device (marked
«ثبت‌شده در این دستگاه / recorded on this device») and are also sent to the
Supabase `activity_log` table **if it exists** (see the optional upgrade below).

## Optional one-time upgrade — shared log in Supabase (preferred long-term)

Table creation needs the Supabase SQL editor (a human step, ~2 minutes).
ژاله: Supabase → SQL Editor → paste and run:

```sql
create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor text not null,
  action text not null,
  target text,
  detail text
);
alter table public.activity_log enable row level security;

-- Admins (profiles.is_admin) can read and add entries.
create policy "activity_log read for admins" on public.activity_log
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
create policy "activity_log insert for admins" on public.activity_log
  for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
```

`admin.html` already reads from and writes to this table when it exists — no
code change needed afterwards. The JSON file remains the agent-side record.
