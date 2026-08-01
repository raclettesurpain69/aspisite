-- Profil applicatif lie 1:1 a auth.users. `company_id` est nullable car un
-- compte existe (via Supabase Auth) avant que l'onboarding ne cree son
-- entreprise ; le trigger ci-dessous garantit qu'une ligne existe toujours,
-- evitant les utilisateurs "orphelins" sans profil.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_company_id_idx on public.users(company_id);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Cree automatiquement le profil applicatif a l'inscription (avant meme
-- que l'entreprise ne soit creee cote application).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Empeche un utilisateur authentifie de s'auto-promouvoir (role) ou de se
-- rattacher a une autre entreprise en modifiant directement sa propre
-- ligne. Deux regles distinctes :
--  - company_id ne peut JAMAIS changer via une session utilisateur (il n'y
--    a pas de fonctionnalite "rejoindre une autre entreprise" ; seul le
--    service_role, cote Server Action d'onboarding, peut l'assigner) ;
--  - role ne peut changer que si l'auteur est deja owner/admin de CETTE
--    MEME entreprise (company_id est garanti inchange a ce stade).
-- auth.uid() est NULL quand l'appel vient du service_role (webhooks,
-- onboarding) : ce contexte contourne deja RLS et est de confiance, donc
-- aucune des deux regles ne s'applique dans ce cas.
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.company_id is distinct from old.company_id then
    raise exception 'Le changement d''entreprise d''un utilisateur ne peut pas se faire directement.';
  end if;

  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.users
      where id = auth.uid()
        and role in ('owner', 'admin')
        and company_id = old.company_id
    ) then
      raise exception 'Seuls les proprietaires ou administrateurs peuvent modifier le role d''un utilisateur.';
    end if;
  end if;

  return new;
end;
$$;

create trigger users_prevent_self_privilege_escalation
  before update on public.users
  for each row execute function public.prevent_self_privilege_escalation();
