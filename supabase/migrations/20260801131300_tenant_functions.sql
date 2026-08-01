-- Fonctions utilitaires multi-tenant. SECURITY DEFINER + search_path fixe
-- (bonne pratique Supabase) : elles s'executent avec les privileges du
-- proprietaire des tables (postgres), qui contourne RLS sur `users`,
-- evitant toute recursion quand les policies RLS des autres tables les
-- appellent (voir migration RLS).
create or replace function public.get_my_company_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select company_id from public.users where id = auth.uid();
$$;

create or replace function public.company_user_count(p_company_id uuid)
returns bigint
language sql
security definer
stable
set search_path = public
as $$
  select count(*) from public.users where company_id = p_company_id;
$$;

-- Usage du mois calendaire en cours, a comparer aux limites du plan
-- (subscription_plans.max_calls_per_month / max_call_duration_seconds)
-- avant d'accepter un nouvel appel (etape 3+).
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
    and created_at >= date_trunc('month', now());
$$;

-- Vue de commodite : limites du plan actif d'une entreprise, prete a etre
-- jointe a get_company_usage() cote application.
create or replace view public.company_plan_limits as
select
  c.id as company_id,
  c.plan_code,
  c.subscription_status,
  p.max_calls_per_month,
  p.max_call_duration_seconds,
  p.max_users
from public.companies c
join public.subscription_plans p on p.code = c.plan_code;
