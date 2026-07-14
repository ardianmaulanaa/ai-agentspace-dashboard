
create extension if not exists "pgcrypto";

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'owner', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null,
  type text not null check (type in ('text', 'forum', 'voice')),
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  sender_type text not null check (sender_type in ('user', 'agent', 'system')),
  sender_name text,
  content text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  author_name text,
  title text not null,
  content text not null,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_name text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_workspace_position_idx
  on public.categories(workspace_id, position);

create index if not exists workspace_members_user_idx
  on public.workspace_members(user_id);

create index if not exists channels_workspace_category_position_idx
  on public.channels(workspace_id, category_id, position);

create index if not exists messages_channel_created_at_idx
  on public.messages(channel_id, created_at);

create index if not exists forum_posts_channel_updated_at_idx
  on public.forum_posts(channel_id, updated_at desc);

create index if not exists forum_replies_post_created_at_idx
  on public.forum_replies(post_id, created_at);

insert into public.workspaces (name, slug)
values ('AgentSpace', 'agentspace')
on conflict (slug) do nothing;

insert into public.categories (workspace_id, name, slug, position)
select id, 'Portfolio', 'portfolio', 1
from public.workspaces
where slug = 'agentspace'
on conflict (workspace_id, slug) do nothing;

insert into public.channels (workspace_id, category_id, name, slug, type, position)
select w.id, c.id, seed.name, seed.slug, seed.type, seed.position
from public.workspaces w
join public.categories c on c.workspace_id = w.id and c.slug = 'portfolio'
cross join (
  values
    ('ide-project', 'ide-project', 'text', 1),
    ('forum-review', 'forum-review', 'forum', 2),
    ('voice-room', 'voice-room', 'voice', 3)
) as seed(name, slug, type, position)
where w.slug = 'agentspace'
on conflict (workspace_id, slug) do nothing;
