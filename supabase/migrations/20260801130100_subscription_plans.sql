-- Plans d'abonnement. Table de reference (pas de company_id) : chaque
-- entreprise pointe vers un plan via `companies.plan_code`. L'integration
-- Stripe (etape future) se contentera d'ajouter des colonnes/tables sans
-- toucher a celle-ci.
create table public.subscription_plans (
  code text primary key check (code in ('trial', 'starter', 'pro', 'business')),
  name text not null,
  price_cents integer not null default 0,
  max_calls_per_month integer not null,
  max_call_duration_seconds integer not null,
  max_users integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.subscription_plans is
  'Plans commercialises et leurs limites. Tarifs en centimes (EUR), placeholders a ajuster avant lancement commercial / integration Stripe.';

-- Limites de depart pour le MVP. Ajustables sans migration (simple UPDATE).
insert into public.subscription_plans
  (code, name, price_cents, max_calls_per_month, max_call_duration_seconds, max_users)
values
  ('trial',    'Essai gratuit', 0,     50,   300, 1),
  ('starter',  'Starter',       2900,  150,  300, 2),
  ('pro',      'Pro',           7900,  500,  600, 5),
  ('business', 'Business',      19900, 2000, 900, 20)
on conflict (code) do nothing;
