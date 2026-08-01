-- Active Row Level Security sur toutes les tables multi-tenant. Le client
-- service_role (src/lib/supabase/server.ts: createServiceRoleClient) reste
-- utilisable par les webhooks Twilio/routes systeme car il contourne RLS
-- par conception Supabase : ces politiques ne s'appliquent qu'aux clients
-- "utilisateur" (roles anon/authenticated).

-- subscription_plans: table de reference publique, lecture seule.
alter table public.subscription_plans enable row level security;

create policy "subscription_plans_select_active"
  on public.subscription_plans for select
  to authenticated, anon
  using (is_active);

-- companies
alter table public.companies enable row level security;

create policy "companies_select_own"
  on public.companies for select
  to authenticated
  using (id = public.get_my_company_id());

create policy "companies_update_own_admin"
  on public.companies for update
  to authenticated
  using (
    id = public.get_my_company_id()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role in ('owner', 'admin')
    )
  )
  with check (id = public.get_my_company_id());

-- company_phone_numbers: lecture seule cote app (attribution geree en
-- back-office / etape 3, jamais par l'entreprise elle-meme).
alter table public.company_phone_numbers enable row level security;

create policy "company_phone_numbers_select_own"
  on public.company_phone_numbers for select
  to authenticated
  using (company_id = public.get_my_company_id());

-- users
alter table public.users enable row level security;

create policy "users_select_self_or_company"
  on public.users for select
  to authenticated
  using (id = auth.uid() or company_id = public.get_my_company_id());

create policy "users_update_self"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- customers
alter table public.customers enable row level security;

create policy "customers_all_own_company"
  on public.customers for all
  to authenticated
  using (company_id = public.get_my_company_id())
  with check (company_id = public.get_my_company_id());

-- calls: generes par le systeme (service_role) ; les membres de
-- l'entreprise peuvent seulement consulter.
alter table public.calls enable row level security;

create policy "calls_select_own_company"
  on public.calls for select
  to authenticated
  using (company_id = public.get_my_company_id());

-- call_recordings / call_transcriptions n'ont pas de company_id direct :
-- on remonte via la table calls.
alter table public.call_recordings enable row level security;

create policy "call_recordings_select_own_company"
  on public.call_recordings for select
  to authenticated
  using (
    exists (
      select 1 from public.calls
      where calls.id = call_recordings.call_id
        and calls.company_id = public.get_my_company_id()
    )
  );

alter table public.call_transcriptions enable row level security;

create policy "call_transcriptions_select_own_company"
  on public.call_transcriptions for select
  to authenticated
  using (
    exists (
      select 1 from public.calls
      where calls.id = call_transcriptions.call_id
        and calls.company_id = public.get_my_company_id()
    )
  );

-- notifications
alter table public.notifications enable row level security;

create policy "notifications_select_own_company"
  on public.notifications for select
  to authenticated
  using (company_id = public.get_my_company_id());

-- settings
alter table public.settings enable row level security;

create policy "settings_all_own_company"
  on public.settings for all
  to authenticated
  using (company_id = public.get_my_company_id())
  with check (company_id = public.get_my_company_id());

-- api_keys: lecture seule cote app (creation/revocation via une future
-- Server Action qui utilisera le service role pour hasher/stocker).
alter table public.api_keys enable row level security;

create policy "api_keys_select_own_company"
  on public.api_keys for select
  to authenticated
  using (company_id = public.get_my_company_id());

-- call_logs: lecture seule, utile pour un futur onglet "erreurs".
alter table public.call_logs enable row level security;

create policy "call_logs_select_own_company"
  on public.call_logs for select
  to authenticated
  using (company_id = public.get_my_company_id());

-- storage.objects: un membre ne peut lire (ex: generer une URL signee)
-- que les fichiers ranges sous le prefixe de son entreprise
-- (`{company_id}/...`), convention utilisee par call_recordings.storage_path.
create policy "call_recordings_storage_select_own_company"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'call-recordings'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
  );
