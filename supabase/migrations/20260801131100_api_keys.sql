-- Cles d'acces API pour une future integration externe (non utilisees
-- dans le MVP). Seul le hash est stocke : la cle en clair n'est visible
-- qu'une fois, a la creation, cote application.
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index api_keys_company_id_idx on public.api_keys(company_id);
