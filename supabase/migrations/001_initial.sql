-- Person: important people to stay in touch with
create table public.person (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  photo_url text,
  phone text,
  email text,
  reminder_frequency text not null check (reminder_frequency in ('weekly', 'biweekly', 'monthly', 'quarterly', 'custom_days')),
  custom_days int,
  next_reminder_at timestamptz not null,
  relationship_hint text check (relationship_hint in ('family', 'friend', 'coworker', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Outreach: log when user reached out
create table public.outreach (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.person(id) on delete cascade,
  contacted_at timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);

-- Push tokens for reminder notifications
create table public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  unique(user_id, token)
);

-- RLS
alter table public.person enable row level security;
alter table public.outreach enable row level security;
alter table public.user_push_tokens enable row level security;

create policy "Users can manage own persons"
  on public.person for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage outreach for own persons"
  on public.outreach for all
  using (
    exists (
      select 1 from public.person p
      where p.id = outreach.person_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.person p
      where p.id = outreach.person_id and p.user_id = auth.uid()
    )
  );

create policy "Users can manage own push tokens"
  on public.user_push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes
create index person_user_id on public.person(user_id);
create index person_next_reminder_at on public.person(next_reminder_at);
create index outreach_person_id on public.outreach(person_id);
create index outreach_contacted_at on public.outreach(contacted_at);

-- Updated_at trigger for person
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger person_updated_at
  before update on public.person
  for each row execute function public.set_updated_at();
