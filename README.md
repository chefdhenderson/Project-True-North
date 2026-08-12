# Project True North

Wild Fork Canada — Merchant Command dashboard for the Canadian business unit.
Next.js 14 (App Router) + Supabase (auth + database) + Vercel hosting.

## What this replaces

The earlier prototype was a single-file Claude Artifact using in-memory
shared storage and a plaintext username/password list. This repo swaps that
for:
- **Real authentication** — Supabase Auth (email + password), hashed and
  managed by Supabase, not stored in the app.
- **A real database** — Postgres via Supabase, with row-level security so
  only signed-in teammates can read/write.
- **A deployable app** — pushed to GitHub, hosted on Vercel, auto-deploys on
  every push to `main`.

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql` from this repo. It creates
   the tables (`uploads`, `exec_summary`, `master_targets`, `focus_areas`,
   `kpis`, `deliverables`, `commentary`), seeds the 7 focus areas, and sets
   row-level security so any signed-in user can read/write.
3. In **Authentication → Providers**, make sure Email is enabled.
4. In **Authentication → Users**, manually add one account per teammate who
   needs access (name + email + password), or send them invite links.
   This is your access list going forward — there's no separate
   username/password table anymore.
5. Copy your **Project URL** and **anon public key** from
   Settings → API — you'll need them in step 3 below.

## 2. Run locally

```bash
npm install
cp .env.example .env.local
# paste your Supabase URL + anon key into .env.local
npm run dev
```

Visit `http://localhost:3000` — you'll land on the login page.

## 3. Deploy

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), "Add New Project" → import the repo.
3. Add the two environment variables from `.env.example`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in
   Vercel → Project → Settings → Environment Variables.
4. Deploy. Every push to `main` auto-deploys after that.

## How weekly data flows in

Every tab (Master Dashboard + the 7 focus tabs) reads live from the
`uploads` table, filtered by `tag`. Go to **Admin** in the app, upload a
CSV/XLSX, tag it to the right tab, and that tab's KPIs and tables update
immediately for everyone signed in — no re-typing. Manual entry is limited
to: this week's focus (Executive Summary), KPI targets and column mapping
(set once per KPI), the project timeline (deliverables/milestones), and a
short weekly commentary per focus area.

When you build the "super backend" you mentioned, have it insert rows
directly into the `uploads` table (via the Supabase service role key,
server-side only — never expose that key in the browser) using the same
shape the Admin form uses. Every tab will pick it up automatically.

## Project structure

```
app/
  login/            Supabase auth sign-in page
  dashboard/
    layout.tsx       Sidebar nav + auth guard
    page.tsx          Executive Summary
    master/           Master Dashboard (derived from uploads)
    admin/            Upload + tag weekly reports
    focus/[focusId]/  One dynamic page serves all 7 focus areas
components/           Shared UI (Card, Btn, Input, Gauge, flag, etc.)
lib/supabaseClient.ts Supabase browser client
supabase/schema.sql   Full database schema + seed data + RLS policies
```
