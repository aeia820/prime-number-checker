-- Supabase SQL Editorで一度だけ実行してください。
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  handle_name varchar(30) not null check (char_length(trim(handle_name)) between 1 and 30),
  content varchar(500) not null check (char_length(trim(content)) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

revoke all on table public.comments from anon, authenticated;
grant select on table public.comments to anon, authenticated;
grant insert (handle_name, content) on table public.comments to anon, authenticated;
grant usage, select on sequence public.comments_id_seq to anon, authenticated;

drop policy if exists "comments_are_publicly_readable" on public.comments;
create policy "comments_are_publicly_readable"
on public.comments for select
to anon, authenticated
using (true);

drop policy if exists "anyone_can_submit_valid_comments" on public.comments;
create policy "anyone_can_submit_valid_comments"
on public.comments for insert
to anon, authenticated
with check (
  char_length(trim(handle_name)) between 1 and 30
  and char_length(trim(content)) between 1 and 500
);

-- anon/authenticatedにはUPDATE・DELETE権限を付与していません。
-- 投稿日はcreated_atの既定値でサーバー側が記録します。
