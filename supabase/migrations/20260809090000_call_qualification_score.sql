-- Score de qualification du prospect (0-100), genere par l'IA a la
-- finalisation de l'appel (voir CallSummary.qualificationScore et
-- finalizeCall()). Colonne partagee entre appels reels et simules : la
-- structure est prete des maintenant pour les vrais appels Twilio.
alter table public.calls
  add column qualification_score integer
    check (qualification_score is null or (qualification_score between 0 and 100));

alter table public.calls add column qualification_reason text;
