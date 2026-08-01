-- Une transcription complete par appel (1:1).
create table public.call_transcriptions (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null unique references public.calls(id) on delete cascade,
  full_text text not null,
  language text not null default 'fr',
  created_at timestamptz not null default now()
);
