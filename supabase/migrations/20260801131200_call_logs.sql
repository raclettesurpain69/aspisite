create type public.log_level as enum ('debug', 'info', 'warn', 'error');

-- Journal structure des evenements techniques lies a un appel (echec
-- Twilio, timeout IA, erreur de synthese vocale...). Complementaire aux
-- logs serveur (stdout, captures par la plateforme d'hebergement) : ce
-- qui est ici est exploitable directement dans le dashboard (ex: onglet
-- "Erreurs") sans acces aux logs d'infrastructure.
create table public.call_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  call_id uuid references public.calls(id) on delete cascade,
  level public.log_level not null default 'info',
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index call_logs_company_id_created_at_idx
  on public.call_logs(company_id, created_at desc);
create index call_logs_call_id_idx on public.call_logs(call_id);
create index call_logs_error_idx on public.call_logs(company_id, created_at desc)
  where level = 'error';
