-- Etape 3 : le cycle de vie reel d'un appel ne correspond pas au premier
-- jeu de statuts (ringing/in_progress/completed/failed), trop calque sur
-- l'etat brut Twilio. On le remplace par des statuts qui refletent ce que
-- l'entreprise doit comprendre en un coup d'oeil dans le dashboard.
alter type public.call_status rename to call_status_old;

create type public.call_status as enum (
  'incoming',     -- appel recu, pas encore traite
  'answered',     -- l'IA a decroche et la conversation est en cours
  'completed',    -- conversation terminee normalement, resume disponible
  'failed',       -- erreur technique ou appel rejete (limite de plan...)
  'voicemail',    -- le client n'a rien dit (silence/raccroche immediat)
  'transferred'   -- transfere vers un humain (fonctionnalite future)
);

alter table public.calls alter column status drop default;

alter table public.calls
  alter column status type public.call_status
  using (
    case status::text
      when 'ringing' then 'incoming'
      when 'in_progress' then 'answered'
      when 'completed' then 'completed'
      when 'failed' then 'failed'
      else 'incoming'
    end
  )::public.call_status;

alter table public.calls alter column status set default 'incoming';

drop type public.call_status_old;

-- Etat de la conversation en cours (tours assistant/client), necessaire
-- car chaque requete webhook Twilio est traitee par une invocation sans
-- etat partage : c'est cette colonne qui fait le pont entre les appels
-- HTTP successifs d'un meme appel telephonique. Videe/figee dans
-- call_transcriptions.full_text une fois l'appel termine.
alter table public.calls add column conversation jsonb not null default '[]'::jsonb;
