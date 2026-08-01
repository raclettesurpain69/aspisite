# CallFlow AI

Secretaire IA telephonique pour artisans et petites entreprises. Quand
l'entreprise ne peut pas repondre (occupe, pas de reponse, ferme), l'appel
est transfere vers cet assistant qui discute avec le client, recupere ses
informations et envoie un resume a l'entreprise.

Le SaaS ne remplace jamais le numero de l'entreprise : celle-ci configure un
simple renvoi d'appel conditionnel vers un numero Twilio dedie a
l'assistant.

> Statut : **Etape 2/5** — authentification, schema de base de donnees
> complet, Row Level Security, dashboard connecte aux vraies donnees.
> L'IA conversationnelle et Twilio ne sont pas encore branches (voir
> [Feuille de route](#feuille-de-route)).

## Stack technique

| Domaine | Choix | Pourquoi |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript | SSR/Server Components, une seule base de code front + back, deploiement Vercel simple. |
| UI | Tailwind CSS v4 + shadcn/ui (style "new-york") | Composants copies dans le repo (pas de dependance opaque), design coherent inspire de Stripe/Linear/Vercel. |
| Backend | Next.js API Routes / Server Actions | Pas de service separe a deployer/maintenir pour un MVP. |
| Base de donnees | Supabase (PostgreSQL) | Postgres gere, Auth integree, Row Level Security native pour le multi-tenant, offre gratuite genereuse. |
| Auth | Supabase Auth | Evite de reimplementer une gestion de mots de passe/sessions. |
| Telephonie | Twilio Voice | Standard du marche, webhooks simples, SDK Node mature. Isole derriere `TelephonyProvider` pour rester compatible SIP/autres operateurs plus tard. |
| IA conversationnelle | Claude (Anthropic) | Bonne comprehension du contexte en francais, tool-use pour extraire un resume structure. Isole derriere `AIProvider`. |
| Transcription | Whisper (OpenAI) | Bon rapport qualite/prix, isole derriere `STTProvider`. |
| Synthese vocale | ElevenLabs | Voix naturelles, isole derriere `TTSProvider`. |
| Notifications | Resend (email, defaut) + Twilio (SMS/WhatsApp, optionnels) | Email gratuit/quasi-gratuit en priorite pour limiter les couts. |

Chaque fournisseur externe (IA, telephonie, TTS, STT, notifications) est
accede via une interface TypeScript dans `src/lib/<domaine>/`. Le reste de
l'app n'importe jamais un SDK tiers directement : changer de fournisseur se
fait en ne modifiant qu'un seul fichier (`src/lib/<domaine>/index.ts`).

## Structure du projet

```
src/
  app/
    page.tsx                     Landing page publique
    (auth)/                      Route group: login, register, mot de passe oublie
    (dashboard)/                 Route group: dashboard, appels, parametres (proteges par le middleware)
    auth/confirm/                Callback Supabase Auth (confirmation email, reset password)
    api/
      health/                   Health check
      voice/incoming/           Webhook Twilio Voice (appel transfere) — logique etape 3
      voice/status/             Webhook Twilio Status Callback — logique etape 3
      notifications/send/       Envoi du resume post-appel — logique etape 4
  components/
    ui/                         Primitives shadcn/ui (button, card, input...)
    layout/                     Sidebar, topbar du dashboard
    auth/                       Formulaires client (register/login/forgot/reset) branches aux Server Actions
  lib/
    supabase/                   Clients Supabase (browser, server, service role) + helper middleware
    actions/                    Server Actions (inscription, connexion, deconnexion, mot de passe)
    data/                       Requetes de lecture (entreprise courante, dashboard, appels, parametres)
    ai/                         AIProvider (interface) + implementation Claude
    telephony/                  TelephonyProvider (interface) + implementation Twilio
    tts/                        TTSProvider (interface) + implementation ElevenLabs
    stt/                        STTProvider (interface) + implementation Whisper
    notifications/              Envoi email/SMS/WhatsApp + formatage du resume
    env.ts                      Validation Zod des variables d'environnement
  types/
    database.ts                 Types du schema Supabase (voir note plus bas)
  middleware.ts                 Rafraichissement de session + protection des routes du dashboard
supabase/
  config.toml                   Configuration Supabase locale (CLI)
  migrations/                   Schema SQL complet (voir "Schema de base de donnees")
  seed.sql                      Donnees de demo pour le developpement local uniquement
  functions/                    Edge Functions (si besoin, non utilisees dans le MVP)
legacy-python-tool/              Ancien script Python de ce repo (sans rapport avec CallFlow AI, conserve tel quel)
```

## Schema de base de donnees

Tables (`supabase/migrations/`, appliquees dans l'ordre des fichiers) :

`subscription_plans`, `companies`, `company_phone_numbers`, `users`,
`customers`, `calls`, `call_recordings`, `call_transcriptions`,
`notifications`, `settings`, `api_keys`, `call_logs`.

Points d'architecture specifiquement traites :

- **Multi-tenant** : toutes les tables (sauf `subscription_plans`, table de
  reference partagee) portent `company_id`. Chaque entreprise a ses
  utilisateurs, clients, appels et parametres, et ne peut jamais voir ceux
  d'une autre — impose par **Row Level Security** (dernier fichier de
  migration), pas seulement par la logique applicative. `get_my_company_id()`
  (SECURITY DEFINER) sert de base a toutes les policies.
- **Plusieurs numeros Twilio par entreprise** : `company_phone_numbers`
  associe N numeros a une entreprise, avec `phone_number` unique
  globalement. C'est ce qui permettra au webhook Twilio (etape 3) de
  retrouver l'entreprise a partir du champ `To` de l'appel entrant, sans
  jamais modifier ce schema.
- **Plans d'abonnement** : `subscription_plans` (codes `trial`, `starter`,
  `pro`, `business`) porte les limites (`max_calls_per_month`,
  `max_call_duration_seconds`, `max_users`) et un tarif indicatif.
  `companies` reference un plan et porte deja `subscription_status`,
  `trial_ends_at`, `stripe_customer_id`/`stripe_subscription_id` (nuls tant
  que Stripe n'est pas integre : aucune migration ne sera necessaire pour
  brancher Stripe plus tard, seulement du code applicatif).
- **Limites d'usage** : `get_company_usage(company_id)` calcule le nombre
  d'appels et la duree cumulee du mois en cours ; la vue
  `company_plan_limits` joint ces plafonds au plan actif. `company_user_count(company_id)`
  fait de meme pour le nombre d'utilisateurs. A l'etape 3+, ces fonctions
  serviront a refuser un appel ou une invitation qui depasserait le plan.
- **Audio hors PostgreSQL** : `call_recordings.storage_path` reference un
  fichier dans le bucket prive Supabase Storage `call-recordings`
  (convention `{company_id}/{call_id}.mp3`), jamais de bytes en base. Une
  policy RLS sur `storage.objects` limite la lecture au prefixe de
  l'entreprise de l'utilisateur.
- **Logs exploitables** : `call_logs` (niveau debug/info/warn/error,
  `event_type`, `metadata` jsonb) trace les evenements techniques par appel
  (echec Twilio, timeout IA...), consultable depuis le dashboard sans acces
  aux logs d'infrastructure. Un index partiel sur `level = 'error'` permet
  un futur onglet "Erreurs" rapide meme a grande echelle.

Notes de validation : les migrations ont ete rejouees et testees (schema,
triggers, isolation multi-tenant, policies RLS y compris sur Storage) via
un Postgres local avec un schema `auth`/`storage` minimal reproduit a la
main, car les images Docker de Supabase ne sont pas accessibles depuis cet
environnement de developpement (registre bloque par la politique reseau).
A executer/verifier une nouvelle fois avec `npm run supabase:start` des que
Docker est disponible. `src/types/database.ts` a ete ecrit a la main en
miroir exact du schema valide (la generation normale via
`npm run supabase:types` necessite Supabase local) ; a regenerer via cette
commande des que possible.

## Authentification

Implementee via Supabase Auth + Server Actions (`src/lib/actions/auth.ts`) :

- **Inscription** (`signUpAction`) : cree le compte Supabase Auth, puis (via
  le client `service_role`, qui contourne RLS) l'entreprise et le
  rattachement `owner` du profil — cree automatiquement par le trigger
  `handle_new_user` a l'inscription.
- **Connexion / deconnexion** (`signInAction` / `signOutAction`).
- **Mot de passe oublie / reinitialisation** (`requestPasswordResetAction` /
  `updatePasswordAction`), via le callback `app/auth/confirm/route.ts` qui
  echange le lien recu par email contre une session.
- Un trigger (`prevent_self_privilege_escalation`) empeche un utilisateur
  authentifie de changer son propre `company_id` ou de s'auto-promouvoir
  `owner`/`admin` en modifiant directement sa ligne `users` ; ce garde-fou ne
  s'applique pas au `service_role` (onboarding, webhooks).

## Multi-tenant et securite

- `src/lib/supabase/server.ts` expose deux clients : un client "utilisateur"
  (respecte RLS) et un client `service_role` reserve aux webhooks Twilio et
  a l'onboarding, qui n'ont pas de session utilisateur.
- `src/lib/env.ts` valide toutes les variables d'environnement au demarrage
  (via Zod) : une configuration incomplete fait echouer le build plutot que
  de provoquer une erreur silencieuse en production. Aucun secret n'est
  jamais expose au navigateur (seules les variables `NEXT_PUBLIC_*` le sont).

## Demarrer en local

### Prerequis

- Node.js 20+
- Docker (pour Supabase local)
- Un compte Supabase, Twilio, Anthropic, OpenAI, ElevenLabs et Resend (cles
  API — voir `.env.example`)

### Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run supabase:start       # demarre Supabase en local (Docker)
npm run dev
```

L'application est disponible sur http://localhost:3000.

### Scripts disponibles

| Commande | Effet |
|---|---|
| `npm run dev` | Lance le serveur de developpement Next.js |
| `npm run build` / `npm run start` | Build et lance la version de production |
| `npm run lint` | Lint ESLint |
| `npm run typecheck` | Verification TypeScript sans emission |
| `npm run supabase:start` / `:stop` | Demarre/arrete Supabase local (Docker) |
| `npm run supabase:types` | Regenere `src/types/database.ts` depuis le schema local |

## Feuille de route

1. **Etape 1** — architecture, structure des dossiers, configuration
   Next.js/Supabase, dependances.
2. **Etape 2 (cette livraison)** — authentification, schema de base de
   donnees complet + Row Level Security, dashboard connecte aux vraies
   donnees.
3. **Etape 3** — reception des appels Twilio transferes, conversation IA
   en temps reel (Claude + TTS/STT).
4. **Etape 4** — transcription complete, resume IA structure,
   notifications (email par defaut, SMS/WhatsApp optionnels).
5. **Etape 5** — historique des appels (recherche/filtres/tri), fiche
   appel (audio + transcription + resume), deploiement.
