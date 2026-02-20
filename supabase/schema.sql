-- Run this in Supabase: SQL Editor → New query → paste → Run.
-- You only need to run it once per project.

-- Folders: name + emoji per user
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null default '📁',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Links: url, title, thumbnail; one folder per link
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  url text not null,
  title text not null,
  thumbnail_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.folders enable row level security;
alter table public.links enable row level security;

drop policy if exists "Users can manage own folders" on public.folders;
create policy "Users can manage own folders"
  on public.folders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own links" on public.links;
create policy "Users can manage own links"
  on public.links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Default "Uncategorized" folder: create per user on first sign-in (handled in app)
-- Indexes for list queries
create index if not exists idx_folders_user on public.folders(user_id);
create index if not exists idx_links_user on public.links(user_id);
create index if not exists idx_links_folder on public.links(folder_id);
