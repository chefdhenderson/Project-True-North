-- Project True North — schema
-- Run this whole file once in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ---------- focus areas (the 7 tabs) ----------
create table if not exists focus_areas (
  id text primary key,               -- 'assortment' | 'margin' | 'fefo' | 'pricing' | 'sws' | 'commercial' | 'pnl'
  label text not null,
  sort_order int not null,
  objective text default '',
  updated_at timestamptz default now()
);

insert into focus_areas (id, label, sort_order) values
  ('assortment', 'Assortment', 1),
  ('margin', 'Margin', 2),
  ('fefo', 'FEFO', 3),
  ('pricing', 'Pricing Index', 4),
  ('sws', 'Store-within-Store', 5),
  ('commercial', 'Commercial', 6),
  ('pnl', 'P&L', 7)
on conflict (id) do nothing;

-- ---------- weekly report / document uploads (feeds every tab) ----------
create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  tag text not null,                 -- 'master' | 'exec' | one of the focus_areas.id values
  filename text,
  uploaded_by text,
  summary text,
  headers jsonb,                     -- array of column names, null if not tabular
  rows jsonb,                        -- array of row objects, null if not tabular
  row_count int,
  created_at timestamptz default now()
);
create index if not exists uploads_tag_idx on uploads (tag, created_at desc);

-- ---------- executive summary (singleton, current week) ----------
create table if not exists exec_summary (
  id int primary key default 1,
  week_of date default current_date,
  week_focus text default '',
  bullets jsonb default '[]'::jsonb,
  updated_at timestamptz default now(),
  constraint exec_summary_singleton check (id = 1)
);
insert into exec_summary (id) values (1) on conflict (id) do nothing;

-- ---------- master dashboard targets (things that don't come from a report) ----------
create table if not exists master_targets (
  id int primary key default 1,
  nps_target text default '70',
  constraint master_targets_singleton check (id = 1)
);
insert into master_targets (id) values (1) on conflict (id) do nothing;

-- ---------- KPIs per focus area (target set once, current computed from uploads client-side) ----------
create table if not exists kpis (
  id uuid primary key default gen_random_uuid(),
  focus_id text references focus_areas(id) on delete cascade,
  label text default '',
  target text default '',
  column_name text default '',       -- which uploaded column feeds "current"
  agg text default 'sum',            -- 'sum' | 'avg' | 'latest'
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------- project timeline / deliverables per focus area ----------
create table if not exists deliverables (
  id uuid primary key default gen_random_uuid(),
  focus_id text references focus_areas(id) on delete cascade,
  title text default '',
  milestone text default '',
  owner text default '',
  due date,
  status text default 'On Track',    -- 'On Track' | 'At Risk' | 'Delayed' | 'Done'
  created_at timestamptz default now()
);
create index if not exists deliverables_focus_idx on deliverables (focus_id, due);

-- ---------- weekly commentary per focus area ----------
create table if not exists commentary (
  id uuid primary key default gen_random_uuid(),
  focus_id text references focus_areas(id) on delete cascade,
  author text default '',
  note_date date default current_date,
  text text default '',
  created_at timestamptz default now()
);
create index if not exists commentary_focus_idx on commentary (focus_id, created_at desc);

-- ---------- Row level security: any signed-in teammate can read/write everything ----------
-- This is an internal single-tenant tool — every authenticated user gets full access.
-- Access itself is controlled by who has a Supabase Auth account (see README step 1.4).

alter table focus_areas enable row level security;
alter table uploads enable row level security;
alter table exec_summary enable row level security;
alter table master_targets enable row level security;
alter table kpis enable row level security;
alter table deliverables enable row level security;
alter table commentary enable row level security;

create policy "authenticated read/write focus_areas" on focus_areas for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write uploads" on uploads for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write exec_summary" on exec_summary for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write master_targets" on master_targets for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write kpis" on kpis for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write deliverables" on deliverables for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write commentary" on commentary for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
