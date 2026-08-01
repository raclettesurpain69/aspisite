-- Clients d'une entreprise, deduits des appels recus. Un meme numero de
-- telephone ne cree qu'un seul client par entreprise (mais le meme numero
-- peut exister chez plusieurs entreprises differentes : deux artisans
-- peuvent avoir ete appeles par le meme client).
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  first_name text,
  last_name text,
  phone_number text not null,
  address text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, phone_number)
);

create index customers_company_id_idx on public.customers(company_id);

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();
