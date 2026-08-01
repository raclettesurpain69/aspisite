-- Personnalisation de l'assistant IA par entreprise : ton, langue,
-- objectifs d'appel, questions structurees (au lieu de simples chaines),
-- et une base de connaissances FAQ. Objectif : que deux entreprises
-- puissent avoir deux assistants completement differents sans ecrire de
-- prompt (voir src/lib/ai/prompt-builder.ts).

-- `custom_questions` ne portait que des chaines libres ("questions
-- specifiques au metier"). Le nouveau systeme de questions est structure
-- (label, obligatoire/facultatif, activee/desactivee, ordre = position
-- dans le tableau) : renommage pour refleter ce changement de sens.
alter table public.settings rename column custom_questions to assistant_questions;

alter table public.settings
  alter column assistant_questions set default '[
    {"id": "name", "label": "Nom", "required": true, "enabled": true},
    {"id": "phone", "label": "Telephone", "required": true, "enabled": true},
    {"id": "address", "label": "Adresse", "required": false, "enabled": true},
    {"id": "email", "label": "Email", "required": false, "enabled": true},
    {"id": "reason", "label": "Motif de la demande", "required": true, "enabled": true},
    {"id": "availability", "label": "Disponibilites", "required": false, "enabled": true}
  ]'::jsonb;

-- Convertit les lignes existantes : celles qui n'avaient rien personnalise
-- (valeur par defaut '[]') recoivent le nouveau jeu de questions par
-- defaut ; celles qui portaient d'anciennes chaines libres sont converties
-- au nouveau format structure (facultatives par defaut, contenu preserve).
update public.settings
set assistant_questions = case
  when assistant_questions = '[]'::jsonb then
    '[
      {"id": "name", "label": "Nom", "required": true, "enabled": true},
      {"id": "phone", "label": "Telephone", "required": true, "enabled": true},
      {"id": "address", "label": "Adresse", "required": false, "enabled": true},
      {"id": "email", "label": "Email", "required": false, "enabled": true},
      {"id": "reason", "label": "Motif de la demande", "required": true, "enabled": true},
      {"id": "availability", "label": "Disponibilites", "required": false, "enabled": true}
    ]'::jsonb
  when jsonb_typeof(assistant_questions -> 0) = 'string' then (
    select jsonb_agg(
      jsonb_build_object(
        'id', 'legacy-' || t.idx,
        'label', t.elem,
        'required', false,
        'enabled', true
      )
    )
    from jsonb_array_elements_text(assistant_questions) with ordinality as t(elem, idx)
  )
  else assistant_questions
end
where jsonb_typeof(assistant_questions) = 'array';

-- Ton de l'assistant (impacte la formulation du prompt, voir prompt-builder.ts).
alter table public.settings
  add column tone text not null default 'professionnel'
    check (tone in ('professionnel', 'chaleureux', 'premium', 'direct'));

-- Langue principale de la conversation.
alter table public.settings add column language text not null default 'fr';

-- Objectifs de l'appel (choix multiples) : liste de codes, voir
-- src/lib/ai/types.ts (CallGoal) pour les valeurs valides.
alter table public.settings
  add column call_goals jsonb not null default '["prise_message"]'::jsonb;

comment on column public.settings.assistant_questions is
  'Tableau structure {id,label,required,enabled} ; l''ordre du tableau est l''ordre d''utilisation dans la conversation.';
comment on column public.settings.call_goals is
  'Tableau de codes CallGoal (rendez_vous, qualification, devis, transfert_urgence, prise_message).';

-- Base de connaissances FAQ par entreprise, utilisee par le prompt-builder
-- pour repondre aux questions frequentes sans que Claude n'invente une
-- reponse. Table dediee (plutot qu'un jsonb sur settings) pour beneficier
-- des memes conventions RLS/index que les autres tables et pour absorber
-- une croissance du nombre d'entrees sans limite de taille de ligne.
create table public.faq_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  question text not null,
  answer text not null,
  is_enabled boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index faq_entries_company_id_idx on public.faq_entries(company_id, display_order);

create trigger faq_entries_set_updated_at
  before update on public.faq_entries
  for each row execute function public.set_updated_at();

alter table public.faq_entries enable row level security;

create policy "faq_entries_all_own_company"
  on public.faq_entries for all
  to authenticated
  using (company_id = public.get_my_company_id())
  with check (company_id = public.get_my_company_id());
