-- Mode simulation (demo sans Twilio, voir src/lib/simulation/) : un
-- simple marqueur de provenance sur `calls`, sans dupliquer le schema ni
-- le pipeline IA/finalisation deja utilise par les vrais appels Twilio.
alter table public.calls add column is_simulated boolean not null default false;

-- Email du client : absent du schema initial, necessaire au mode
-- simulation (qui doit pouvoir le collecter) et utile aussi sur les vrais
-- appels quand le client le communique.
alter table public.customers add column email text;

-- Les appels simules ne representent aucune activite commerciale reelle :
-- ils ne doivent pas consommer le quota mensuel du plan d'abonnement.
create or replace function public.get_company_usage(p_company_id uuid)
returns table (calls_this_period bigint, total_duration_seconds bigint)
language sql
security definer
stable
set search_path = public
as $$
  select
    count(*) as calls_this_period,
    coalesce(sum(duration_seconds), 0) as total_duration_seconds
  from public.calls
  where company_id = p_company_id
    and created_at >= date_trunc('month', now())
    and is_simulated = false;
$$;
