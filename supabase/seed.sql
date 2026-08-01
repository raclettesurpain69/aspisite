-- Donnees de demonstration pour le developpement local uniquement.
-- Chargees par `supabase db reset` (jamais executees en production).
--
-- Cree ici une entreprise de test ; le premier utilisateur qui s'inscrit
-- via /register cree lui-meme sa propre entreprise (voir la Server Action
-- signUpAction), donc aucune donnee utilisateur/auth n'est necessaire ici.
insert into public.companies (id, name, business_type, plan_code)
values ('00000000-0000-0000-0000-000000000001', 'Plomberie Demo', 'plombier', 'trial')
on conflict (id) do nothing;

insert into public.settings (company_id, custom_questions)
values (
  '00000000-0000-0000-0000-000000000001',
  '["Y a-t-il une fuite active ?", "L''arrivee d''eau generale est-elle coupee ?", "S''agit-il du chauffe-eau ?"]'::jsonb
)
on conflict (company_id) do nothing;
