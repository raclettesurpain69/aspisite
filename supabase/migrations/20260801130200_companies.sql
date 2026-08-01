-- Table racine du multi-tenant : chaque entreprise cliente. Toutes les
-- autres tables (users, customers, calls...) referencent companies.id et
-- sont filtrees par RLS sur cette valeur (voir migration RLS finale).
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_url text,
  business_type text,
  address text,
  city text,
  timezone text not null default 'Europe/Paris',
  business_hours jsonb not null default '{}'::jsonb,

  -- Abonnement. Prepare pour Stripe sans le brancher : les colonnes
  -- stripe_* restent nulles tant que l'integration n'existe pas.
  plan_code text not null default 'trial' references public.subscription_plans(code),
  subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  current_period_start timestamptz default now(),
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();
