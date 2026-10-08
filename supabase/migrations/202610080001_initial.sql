create extension if not exists vector;
create extension if not exists pgcrypto;

create type public.collection_visibility as enum ('public', 'private');
create type public.ingestion_status as enum ('pending', 'processing', 'ready', 'failed');
create type public.knowledge_record_type as enum ('project', 'course', 'research');

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  description text not null default '',
  visibility public.collection_visibility not null default 'private',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collection_members (
  collection_id uuid not null references public.collections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('viewer','editor','owner')),
  primary key (collection_id, user_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  file_path text not null,
  mime_type text not null check (mime_type in ('application/pdf','text/plain','text/markdown','application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  checksum text not null check (checksum ~ '^[a-f0-9]{64}$'),
  ingestion_status public.ingestion_status not null default 'pending',
  ingestion_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, checksum)
);

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null check (char_length(content) > 0),
  embedding vector(1536),
  page_number integer check (page_number > 0),
  section_title text,
  token_count integer not null check (token_count > 0),
  content_tsvector tsvector generated always as (to_tsvector('english', content)) stored,
  unique (document_id, chunk_index)
);

create table public.knowledge_records (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  record_type public.knowledge_record_type not null,
  record_key text not null,
  title text not null,
  data_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (collection_id, record_type, record_key)
);

create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  collection_id uuid not null references public.collections(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','tool')),
  content text not null,
  citations_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.tool_calls (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete set null,
  tool_name text not null,
  success boolean not null,
  duration_ms integer not null check (duration_ms >= 0),
  error_code text,
  created_at timestamptz not null default now()
);

create table public.evaluation_runs (
  id uuid primary key default gen_random_uuid(),
  suite_version text not null,
  model_name text not null,
  metrics_json jsonb not null,
  created_at timestamptz not null default now()
);

create index document_chunks_tsv_idx on public.document_chunks using gin (content_tsvector);
create index document_chunks_embedding_idx on public.document_chunks using hnsw (embedding vector_cosine_ops) where embedding is not null;
create index documents_collection_idx on public.documents (collection_id, ingestion_status);
create index records_collection_type_idx on public.knowledge_records (collection_id, record_type);
create index tool_calls_created_idx on public.tool_calls (created_at desc);

alter table public.collections enable row level security;
alter table public.collection_members enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.knowledge_records enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.tool_calls enable row level security;
alter table public.evaluation_runs enable row level security;

create function public.can_read_collection(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.collections c
    where c.id = target and (c.visibility = 'public' or c.owner_id = auth.uid() or exists (
      select 1 from public.collection_members m where m.collection_id = c.id and m.user_id = auth.uid()
    ))
  );
$$;

create policy "collections readable by scope" on public.collections for select using (public.can_read_collection(id));
create policy "owners manage collections" on public.collections for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "documents readable by collection" on public.documents for select using (public.can_read_collection(collection_id));
create policy "records readable by collection" on public.knowledge_records for select using (public.can_read_collection(collection_id));
create policy "chunks readable by document collection" on public.document_chunks for select using (exists (select 1 from public.documents d where d.id = document_id and public.can_read_collection(d.collection_id)));
create policy "owners manage documents" on public.documents for all using (exists (select 1 from public.collections c where c.id=collection_id and c.owner_id=auth.uid())) with check (exists (select 1 from public.collections c where c.id=collection_id and c.owner_id=auth.uid()));
create policy "owners manage records" on public.knowledge_records for all using (exists (select 1 from public.collections c where c.id=collection_id and c.owner_id=auth.uid())) with check (exists (select 1 from public.collections c where c.id=collection_id and c.owner_id=auth.uid()));

revoke all on all tables in schema public from anon;
grant select on public.collections, public.documents, public.document_chunks, public.knowledge_records to authenticated;
