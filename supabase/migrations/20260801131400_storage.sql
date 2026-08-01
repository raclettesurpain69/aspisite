-- Bucket prive pour les enregistrements audio d'appel. Jamais public :
-- l'acces se fait via les policies RLS de storage.objects (migration
-- suivante) ou des URLs signees generees cote serveur.
insert into storage.buckets (id, name, public)
values ('call-recordings', 'call-recordings', false)
on conflict (id) do nothing;
