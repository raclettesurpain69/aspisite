-- Mode test : quand actif, chaque etape d'un appel (Twilio, Claude,
-- ElevenLabs, Supabase) journalise son temps d'execution dans call_logs
-- (voir src/lib/calls/timing.ts), pour diagnostiquer un appel de test en
-- conditions reelles sans devoir l'activer en permanence (cout de logs
-- superflu) une fois la mise au point terminee.
alter table public.settings add column test_mode boolean not null default false;
