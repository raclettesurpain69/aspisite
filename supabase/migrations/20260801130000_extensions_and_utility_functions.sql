-- Extensions requises.
create extension if not exists pgcrypto;

-- Fonction generique de mise a jour de `updated_at`, reutilisee par toutes
-- les tables qui en ont une (evite de dupliquer la logique par table).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
