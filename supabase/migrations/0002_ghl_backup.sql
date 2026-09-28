-- GHL Backup tables: a complete, unfiltered copy of GHL data, fully isolated
-- from the portal's own contacts/opportunities tables. The portal's code
-- never reads these — they exist purely so nothing is ever lost, even if a
-- record is deleted in GHL or doesn't qualify for the portal's "Main" tag.
--
-- Deletion semantics: rows are NEVER removed. When a sync pass no longer
-- sees a record in GHL, its deleted_at gets set (once, on first detection)
-- instead of the row being dropped. Every row also carries synced_at (last
-- time we confirmed it against GHL) and a full raw JSON payload alongside
-- the modeled columns, so nothing is lost even if a field wasn't anticipated.

create table if not exists ghl_backup_contacts (
  ghl_contact_id text primary key,
  location_id text,
  first_name text,
  last_name text,
  email text,
  phone text,
  company_name text,
  owner_id text,
  tags jsonb not null default '[]',
  custom_fields jsonb not null default '{}',
  raw jsonb not null default '{}',
  date_added timestamptz,
  date_updated timestamptz,
  synced_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_ghl_backup_contacts_deleted on ghl_backup_contacts (deleted_at);
create index if not exists idx_ghl_backup_contacts_synced on ghl_backup_contacts (synced_at);

create table if not exists ghl_backup_opportunities (
  ghl_opportunity_id text primary key,
  contact_id text,
  pipeline_id text,
  stage_id text,
  name text,
  monetary_value numeric,
  status text,
  owner_id text,
  raw jsonb not null default '{}',
  date_added timestamptz,
  date_updated timestamptz,
  synced_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_ghl_backup_opportunities_deleted on ghl_backup_opportunities (deleted_at);
create index if not exists idx_ghl_backup_opportunities_synced on ghl_backup_opportunities (synced_at);

create table if not exists ghl_backup_appointments (
  ghl_appointment_id text primary key,
  contact_id text,
  calendar_id text,
  title text,
  start_time timestamptz,
  end_time timestamptz,
  status text,
  assigned_user_id text,
  raw jsonb not null default '{}',
  date_added timestamptz,
  synced_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_ghl_backup_appointments_contact on ghl_backup_appointments (contact_id);
create index if not exists idx_ghl_backup_appointments_deleted on ghl_backup_appointments (deleted_at);

create table if not exists ghl_backup_notes (
  ghl_note_id text primary key,
  contact_id text,
  body text,
  user_id text,
  date_added timestamptz,
  raw jsonb not null default '{}',
  synced_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_ghl_backup_notes_contact on ghl_backup_notes (contact_id);
create index if not exists idx_ghl_backup_notes_deleted on ghl_backup_notes (deleted_at);

create table if not exists ghl_backup_tasks (
  ghl_task_id text primary key,
  contact_id text,
  title text,
  body text,
  due_date timestamptz,
  completed boolean,
  assigned_to text,
  raw jsonb not null default '{}',
  synced_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_ghl_backup_tasks_contact on ghl_backup_tasks (contact_id);
create index if not exists idx_ghl_backup_tasks_deleted on ghl_backup_tasks (deleted_at);

-- Tracks progress through the contact list for the notes/tasks/appointments
-- sweep, which processes contacts in small batches across many cron ticks
-- (rather than all ~500+ at once) to stay well within GHL rate limits and
-- serverless function time limits. Singleton row.
create table if not exists ghl_backup_sweep_state (
  id int primary key default 1,
  cursor_index int not null default 0,
  updated_at timestamptz not null default now()
);
insert into ghl_backup_sweep_state (id, cursor_index) values (1, 0) on conflict (id) do nothing;

alter table ghl_backup_contacts enable row level security;
alter table ghl_backup_opportunities enable row level security;
alter table ghl_backup_appointments enable row level security;
alter table ghl_backup_notes enable row level security;
alter table ghl_backup_tasks enable row level security;
alter table ghl_backup_sweep_state enable row level security;
-- Deliberately no policies: only the service-role key (server-side backup
-- routes) can touch these tables. The anon key used by client-facing paths
-- gets zero access, and the portal's own code never queries them at all.
