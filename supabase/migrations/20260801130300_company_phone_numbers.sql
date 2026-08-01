-- Numeros Twilio associes a une entreprise. Une entreprise peut avoir
-- plusieurs numeros (plusieurs metiers/agences, multi-langue...), et
-- `phone_number` est unique globalement : c'est ce qui permet au webhook
-- Twilio Voice de retrouver l'entreprise concernee a partir du champ `To`
-- de l'appel entrant, sans jamais avoir a modifier ce schema plus tard.
create table public.company_phone_numbers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  phone_number text not null unique,
  twilio_sid text,
  label text,
  is_primary boolean not null default true,
  created_at timestamptz not null default now()
);

create index company_phone_numbers_company_id_idx
  on public.company_phone_numbers(company_id);
