-- Configuration IA et notifications d'une entreprise (1:1). Les infos
-- d'identite de l'entreprise (nom, logo, secteur, adresse...) vivent dans
-- `companies` ; cette table ne porte que ce qui pilote la conversation IA
-- et l'envoi des resumes.
create table public.settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  greeting_message text not null default
    'Bonjour, vous etes bien chez nous. Je suis l''assistant telephonique de l''entreprise. Je vais recueillir quelques informations afin qu''ils puissent vous rappeler rapidement.',
  custom_questions jsonb not null default '[]'::jsonb,
  notification_channels public.notification_channel[] not null default array['email']::public.notification_channel[],
  updated_at timestamptz not null default now()
);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();
