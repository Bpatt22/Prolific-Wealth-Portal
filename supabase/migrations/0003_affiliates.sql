-- Affiliates: a third portal role, separate from team_members. An affiliate
-- is portal-only — unlike a team member, no GHL user is ever created for
-- them. Their visibility is a free-text name match against each contact's
-- "Referred By?" GHL custom field (see canAffiliateAccessContact), not GHL
-- ownership, so this table doesn't need (and must not have) a ghl_user_id
-- column the way team_members does.

create table if not exists affiliates (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  site text not null,
  created_at timestamptz not null default now()
);

-- Case/whitespace-insensitive uniqueness on name — two affiliates with the
-- same name would see each other's referrals, since matching is name-only.
create unique index if not exists idx_affiliates_name_norm
  on affiliates (lower(regexp_replace(trim(name), '\s+', ' ', 'g')));

alter table affiliates enable row level security;

-- Lets the invite/login flow (browser client, anon key) check "am I an
-- affiliate?" to decide where to route after sign-in, without needing the
-- service-role key client-side. All other access goes through server-side
-- route handlers using the service role key.
drop policy if exists "read own affiliate row" on affiliates;
create policy "read own affiliate row" on affiliates
  for select using (auth_user_id = auth.uid());
