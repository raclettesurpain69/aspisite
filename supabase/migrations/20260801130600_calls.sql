create type public.call_status as enum ('ringing', 'in_progress', 'completed', 'failed');
create type public.call_urgency as enum ('low', 'normal', 'high', 'critical');

-- Un appel gere par l'assistant IA. `duration_seconds` sert directement au
-- calcul d'usage mensuel (voir get_company_usage) pour appliquer les
-- limites du plan d'abonnement.
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,

  twilio_call_sid text unique,
  from_number text not null,
  to_number text not null,
  status public.call_status not null default 'ringing',

  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,

  reason text,
  problem_description text,
  urgency public.call_urgency not null default 'normal',
  availability text,
  additional_info text,
  extra_fields jsonb not null default '{}'::jsonb,
  recommended_action text,
  summary_text text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calls_company_id_created_at_idx on public.calls(company_id, created_at desc);
create index calls_customer_id_idx on public.calls(customer_id);

create trigger calls_set_updated_at
  before update on public.calls
  for each row execute function public.set_updated_at();
