-- L'audio n'est jamais stocke en base : seule la reference vers Supabase
-- Storage (bucket prive `call-recordings`, cree dans une migration
-- ulterieure) est persistee ici. Convention de chemin :
-- `{company_id}/{call_id}.mp3`.
create table public.call_recordings (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  storage_bucket text not null default 'call-recordings',
  storage_path text not null,
  mime_type text not null default 'audio/mpeg',
  duration_seconds integer,
  twilio_recording_sid text,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create index call_recordings_call_id_idx on public.call_recordings(call_id);
