-- Prolific Portal: mirror tables + team mapping.
-- Run this once in Supabase SQL Editor (Project > SQL Editor > New query).
-- This does NOT touch "Funding Ledger" or "Referral Ledger" — those keep being
-- populated by your existing automation and are only ever read from here.

-- Maps a portal login (Supabase Auth user) to the GHL user they are in GoHighLevel.
-- This is what "assigned to me in GHL" access control is built on.
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  ghl_user_id text not null unique,
  name text,
  email text not null,
  created_at timestamptz not null default now()
);

-- Mirror of GHL contacts, kept in sync by webhooks (see /api/webhooks/ghl/contact)
-- and an initial backfill. Used for list views and owner-based filtering;
-- the contact detail page still reads live from GHL for full fidelity.
create table if not exists contacts (
  ghl_contact_id text primary key,
  location_id text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  owner_id text,
  tags jsonb not null default '[]',
  custom_fields jsonb not null default '{}',
  date_added timestamptz,
  date_updated timestamptz,
  synced_at timestamptz not null default now()
);
create index if not exists idx_contacts_owner on contacts (owner_id);

-- Mirror of GHL opportunities in the "Prolific Wealth Group" pipeline, kept in
-- sync by webhooks and updated optimistically when the portal moves a card.
create table if not exists opportunities (
  ghl_opportunity_id text primary key,
  contact_id text references contacts (ghl_contact_id) on delete set null,
  pipeline_id text not null,
  stage_id text not null,
  name text,
  monetary_value numeric,
  status text,
  owner_id text,
  date_added timestamptz,
  date_updated timestamptz,
  synced_at timestamptz not null default now()
);
create index if not exists idx_opportunities_owner on opportunities (owner_id);
create index if not exists idx_opportunities_stage on opportunities (stage_id);

alter table team_members enable row level security;
alter table contacts enable row level security;
alter table opportunities enable row level security;

-- Direct client reads are locked down by default (all app reads/writes go
-- through server-side route handlers using the service role key, which
-- bypasses RLS and applies the owner filter explicitly in code). These
-- policies exist as defense-in-depth in case a client ever queries directly.
drop policy if exists "read own mapping" on team_members;
create policy "read own mapping" on team_members
  for select using (auth_user_id = auth.uid());

drop policy if exists "owner scoped contacts" on contacts;
create policy "owner scoped contacts" on contacts
  for select using (
    owner_id in (select ghl_user_id from team_members where auth_user_id = auth.uid())
  );

drop policy if exists "owner scoped opportunities" on opportunities;
create policy "owner scoped opportunities" on opportunities
  for select using (
    owner_id in (select ghl_user_id from team_members where auth_user_id = auth.uid())
  );
