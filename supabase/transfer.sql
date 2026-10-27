-- Strike Path: short transfer codes (like K7Q-4MZ) for moving progress between devices.
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.
--
-- How it works: "Get a code" stores a copy of your progress under a random 6-character code.
-- Typing the code on another device claims that copy and deletes it. Codes expire after 1 hour,
-- work once, and the table itself can't be read or listed directly by anyone.

create table if not exists public.transfers (
  code text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- Row-level security with no policies: the table is only reachable through the two functions below.
alter table public.transfers enable row level security;
revoke all on public.transfers from anon, authenticated;

create or replace function public.create_transfer(payload jsonb)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';  -- no 0/O, 1/I/L: easy to read and type
  c text;
  i int;
begin
  delete from public.transfers where created_at < now() - interval '1 hour';
  if octet_length(payload::text) > 2000000 then
    raise exception 'progress too large to transfer';
  end if;
  loop
    c := '';
    for i in 1..6 loop
      c := c || substr(alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % length(alphabet)), 1);
    end loop;
    begin
      insert into public.transfers (code, data) values (c, payload);
      exit;
    exception when unique_violation then
      -- extremely rare: pick another code
    end;
  end loop;
  return c;
end;
$$;

create or replace function public.claim_transfer(code_in text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb;
begin
  delete from public.transfers where created_at < now() - interval '1 hour';
  delete from public.transfers
    where code = upper(regexp_replace(coalesce(code_in, ''), '[^A-Za-z0-9]', '', 'g'))
    returning data into d;
  return d;
end;
$$;

revoke all on function public.create_transfer(jsonb) from public;
revoke all on function public.claim_transfer(text) from public;
grant execute on function public.create_transfer(jsonb) to anon, authenticated;
grant execute on function public.claim_transfer(text) to anon, authenticated;
