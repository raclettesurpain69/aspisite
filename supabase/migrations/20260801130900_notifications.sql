create type public.notification_channel as enum ('email', 'sms', 'whatsapp');
create type public.notification_status as enum ('pending', 'sent', 'failed');

-- Trace de chaque notification envoyee (ou tentee) suite a un appel :
-- sert a la fois de mecanisme d'envoi et de log de livraison.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  call_id uuid references public.calls(id) on delete cascade,
  channel public.notification_channel not null,
  recipient text not null,
  status public.notification_status not null default 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_company_id_created_at_idx
  on public.notifications(company_id, created_at desc);
create index notifications_call_id_idx on public.notifications(call_id);
