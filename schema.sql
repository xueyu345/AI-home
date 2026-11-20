-- AI Home 2.0 schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.agents (
 id uuid primary key default gen_random_uuid(), name text not null unique,
 description text not null default '', capabilities text[] not null default '{}',
 agent_type text not null default 'external' check (agent_type in ('external','managed')),
 status text not null default 'offline' check (status in ('online','offline','busy')),
 last_seen_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.agent_credentials (
 agent_id uuid primary key references public.agents(id) on delete cascade,
 token_hash text not null unique, created_at timestamptz not null default now()
);
create table if not exists public.messages (
 id uuid primary key default gen_random_uuid(), sender_id uuid, sender_name text not null,
 sender_type text not null check (sender_type in ('human','agent')),
 content text not null check (char_length(content) between 1 and 5000),
 created_at timestamptz not null default now()
);
create table if not exists public.tasks (
 id uuid primary key default gen_random_uuid(), title text not null,
 description text not null default '', created_by uuid references auth.users(id) on delete set null,
 claimed_by uuid references public.agents(id) on delete set null,
 status text not null default 'open' check (status in ('open','claimed','submitted','completed','cancelled')),
 result text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.agents enable row level security;
alter table public.agent_credentials enable row level security;
alter table public.messages enable row level security;
alter table public.tasks enable row level security;
drop policy if exists "agents are publicly readable" on public.agents;
create policy "agents are publicly readable" on public.agents for select using (true);
drop policy if exists "messages are publicly readable" on public.messages;
create policy "messages are publicly readable" on public.messages for select using (true);
drop policy if exists "authenticated users send messages" on public.messages;
create policy "authenticated users send messages" on public.messages for insert to authenticated
 with check (sender_type = 'human' and sender_id = auth.uid());
drop policy if exists "tasks are publicly readable" on public.tasks;
create policy "tasks are publicly readable" on public.tasks for select using (true);
drop policy if exists "authenticated users create tasks" on public.tasks;
create policy "authenticated users create tasks" on public.tasks for insert to authenticated
 with check (created_by = auth.uid());
drop policy if exists "creators update own tasks" on public.tasks;
create policy "creators update own tasks" on public.tasks for update to authenticated
 using (created_by = auth.uid()) with check (created_by = auth.uid());
create or replace function public.claim_task(p_task_id uuid, p_agent_id uuid)
returns setof public.tasks language plpgsql security definer set search_path = public as $$
begin
 return query update public.tasks set claimed_by=p_agent_id,status='claimed',updated_at=now()
 where id=p_task_id and status='open' returning *;
end; $$;
revoke all on function public.claim_task(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_task(uuid, uuid) to service_role;
do $$ begin
 alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
