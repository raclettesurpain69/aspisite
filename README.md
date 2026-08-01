# CallFlow AI

Secretaire IA telephonique pour artisans et petites entreprises. Quand
l'entreprise ne peut pas repondre (occupe, pas de reponse, ferme), l'appel
est transfere vers cet assistant qui discute avec le client, recupere ses
informations et envoie un resume a l'entreprise.

Le SaaS ne remplace jamais le numero de l'entreprise : celle-ci configure un
simple renvoi d'appel conditionnel vers un numero Twilio dedie a
l'assistant.

> Statut : **Etape 3.5/5 + Mode Simulation** — outillage de validation du
> systeme telephonique (checklist Twilio, Diagnostic, Journal systeme,
> Mode Test) et un **Mode Simulation** (`/test-call`) qui rejoue toute la
> boucle IA (conversation, resume, creation client, historique) sans
> Twilio, pour demontrer le produit sans compte Twilio payant. L'etape 3
> reste formellement validee uniquement apres un premier appel
> telephonique reel (voir `docs/TWILIO_SETUP.md`). Voir
> [Feuille de route](#feuille-de-route).

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
    (dashboard)/                 Route group: dashboard, appels, test-call, diagnostic, journal, parametres (proteges par le middleware)
    auth/confirm/                Callback Supabase Auth (confirmation email, reset password)
    api/
      health/                   Health check
      voice/incoming/           Webhook Twilio Voice : 1er contact, lookup entreprise, demarre la conversation
      voice/gather/             Reception de chaque tour de parole client, boucle la conversation
      voice/say/                Synthese vocale a la demande (ElevenLabs), lue par <Play>
      voice/status/             Callback statut d'appel Twilio (finalise les raccrochages abrupts)
      voice/recording-status/   Callback enregistrement Twilio -> upload vers Supabase Storage
      notifications/send/       Envoi du resume post-appel — logique etape 4
  components/
    ui/                         Primitives shadcn/ui (button, card, input, switch...)
    layout/                     Sidebar, topbar du dashboard
    auth/                       Formulaires client (register/login/forgot/reset) branches aux Server Actions
    diagnostics/                Carte d'affichage d'un check (OK/Avertissement/Erreur)
    settings/                   Toggle Mode Test
    test-call/                  Chat de simulation d'appel IA
    calls/                      Lecteur audio fictif (appels simules)
  lib/
    supabase/                   Clients Supabase (browser, server, service role) + helper middleware
    actions/                    Server Actions (auth, mode test, simulation)
    data/                       Requetes de lecture (entreprise courante, dashboard, appels, parametres, logs)
    calls/                      Logique metier des appels : lookup entreprise, limites, contexte IA, finalisation, logs, chronometrage
    simulation/                 Moteur du Mode Simulation (reutilise ai/ et calls/finalize.ts)
    diagnostics/                Verifications live (Supabase, Twilio, Claude, ElevenLabs, webhooks)
    ai/                         AIProvider (interface) + implementation Claude + scenarios.ts (simulation)
    telephony/                  TelephonyProvider (interface) + implementation Twilio
    tts/                        TTSProvider (interface) + implementation ElevenLabs
    stt/                        STTProvider (interface) + implementation Whisper (disponible, non utilise dans la boucle d'appel — voir note plus bas)
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
docs/
  TWILIO_SETUP.md               Checklist complete pour un premier appel de test reel
legacy-python-tool/              Ancien script Python de ce repo (sans rapport avec CallFlow AI, conserve tel quel)
```

## Schema de base de donnees

Tables (`supabase/migrations/`, appliquees dans l'ordre des fichiers) :

`subscription_plans`, `companies`, `company_phone_numbers`, `users`,
`customers`, `calls`, `call_recordings`, `call_transcriptions`,
`notifications`, `settings`, `api_keys`, `call_logs`, `faq_entries`.

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
triggers, isolation multi-tenant, policies RLS y compris sur Storage,
idempotence des upserts `calls`/`customers`/`call_recordings`/
`call_transcriptions`, plusieurs numeros par entreprise, appels
simultanes) via un Postgres local avec un schema `auth`/`storage` minimal
reproduit a la main, car les images Docker de Supabase ne sont pas
accessibles depuis cet environnement de developpement (registre bloque par
la politique reseau). Les webhooks Twilio (`/api/voice/*`) ont ete testes
en generant de vraies signatures Twilio (HMAC-SHA1) localement : signature
valide acceptee, signature invalide rejetee (403), et chaque route reste
gracieuse (TwiML/JSON de secours) meme quand Supabase est injoignable. A
revalider en conditions reelles (`npm run supabase:start` + un appel
telephonique effectif) des que Docker est disponible et que de vraies cles
API sont configurees. `src/types/database.ts` a ete ecrit a la main en
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

## Systeme telephonique IA (etape 3)

Boucle complete implementee : **appel transfere -> IA repond -> conversation
-> informations recuperees -> donnees enregistrees**. Priorite donnee a une
boucle qui fonctionne de bout en bout plutot qu'a une experience IA
parfaite (voir points d'amelioration a la fin de cette section).

### Deroulement d'un appel

1. **`POST /api/voice/incoming`** — Twilio route l'appel transfere (no
   answer / busy / horaires fermes) vers ce webhook. La signature Twilio
   est verifiee (`src/lib/calls/verify-request.ts`), puis l'entreprise est
   identifiee a partir du numero appele (`company_phone_numbers`, voir
   `src/lib/calls/company-lookup.ts`). Si le quota mensuel du plan est
   atteint (`hasReachedMonthlyCallLimit`), l'appel est poliment refuse et
   trace comme `failed`. Sinon : creation de la ligne `calls` (idempotente
   via `upsert` sur `twilio_call_sid`, pour tolerer les retentatives
   Twilio), demarrage de l'enregistrement audio en arriere-plan
   (`TelephonyProvider.startCallRecording`), puis premier message TwiML :
   `<Gather input="speech">` avec le message d'accueil joue via `<Play>`.
2. **`GET /api/voice/say`** — Twilio recupere l'audio du dernier message de
   l'assistant. Genere a la demande via ElevenLabs (`TTSProvider`) a partir
   du texte stocke dans `calls.conversation`, jamais pre-calcule ni stocke :
   pas de fichier transitoire a gerer, uniquement les enregistrements
   finaux passent par Supabase Storage.
3. **`POST /api/voice/gather`** — recoit la transcription Twilio (ASR
   integre a `<Gather input="speech">`, aucun appel Whisper necessaire pour
   ce tour de parole) du client. Trois issues :
   - **silence** (aucun `SpeechResult`) : finalisation immediate en statut
     `voicemail` ;
   - **`MAX_CUSTOMER_TURNS` atteint** (6 tours, `src/lib/calls/constants.ts`)
     : cloture avec un message de remerciement et finalisation `completed` ;
   - **sinon** : `AIProvider.generateResponse` genere la reponse suivante,
     ajoutee a `calls.conversation`, et la boucle continue (nouveau
     `<Gather>`).
   Toute erreur IA est rattrapee : message d'excuses + finalisation plutot
   que de laisser l'appel en echec silencieux.
4. **Finalisation** (`src/lib/calls/finalize.ts`) — quel que soit le
   declencheur (fin normale, silence, raccrochage brutal detecte par
   `/api/voice/status`), la meme fonction : appelle
   `AIProvider.summarizeCall` pour extraire nom/adresse/urgence/resume,
   cree ou met a jour le `customers` correspondant (upsert sur
   `company_id, phone_number`), sauvegarde `call_transcriptions.full_text`
   (reconstruit depuis `calls.conversation`) et met a jour la ligne `calls`
   (`status`, `summary_text`, etc.).
5. **`POST /api/voice/status`** — callback Twilio "Call Status Changes" (a
   configurer sur le numero Twilio cote console/API). Seul signal fiable
   pour les raccrochages abrupts survenus avant que `/api/voice/gather`
   n'ait pu finaliser l'appel ; met aussi a jour `duration_seconds`.
6. **`POST /api/voice/recording-status`** — callback "Recording Status
   Callback" (enregistre automatiquement par `startCallRecording`).
   Telecharge l'audio depuis Twilio (Basic Auth) et l'upload dans le
   bucket prive `call-recordings` (`{company_id}/{call_id}.mp3`), puis
   enregistre `call_recordings`.

### Pourquoi pas de WebSocket / Media Streams

Une conversation vocale "vraiment" temps reel (audio en flux continu)
demanderait Twilio Media Streams + un serveur WebSocket dedie — complexite
significative pour un MVP. Le choix ici (`<Gather input="speech">` pour la
reconnaissance vocale + ElevenLabs pour la synthese) donne une conversation
naturelle tour par tour avec une infrastructure entierement basee sur des
routes HTTP sans etat, deployable sur Vercel sans serveur persistant.
`STTProvider`/Whisper reste disponible dans l'architecture pour un usage
futur (ex : re-transcription de l'audio complet pour plus de precision).

### Points a ameliorer (assumes, pas bloquants pour une boucle fonctionnelle)

- Fin de conversation basee sur un compteur fixe (`MAX_CUSTOMER_TURNS`)
  plutot qu'une detection d'intention par l'IA.
- `/api/voice/say` renvoie une reponse vide en cas d'echec ElevenLabs :
  Twilio saute silencieusement l'invite plutot que d'utiliser une voix de
  secours.
- Le callback `/api/voice/status` doit etre configure manuellement sur le
  numero Twilio (console ou API) : ce n'est pas automatise par le code.
- Tests valides uniquement en simulant des requetes Twilio signees
  localement (voir note de validation ci-dessous) : aucun appel telephonique
  reel n'a pu etre passe dans cet environnement de developpement.

## Valider le systeme telephonique avant l'etape 4

L'etape 3 n'est consideree terminee qu'apres un vrai appel telephonique
reussi (voir `docs/TWILIO_SETUP.md` pour la checklist complete : variables
d'environnement exactes, URLs de webhooks, permissions Twilio, limitations
trial vs production). Trois outils preparent et accompagnent ce test :

### Page Diagnostic (`/diagnostics`)

Vérifie en direct (appels reels aux APIs, lectures seules) chaque
dependance externe et affiche un statut ✅ OK / ⚠️ Avertissement / ❌ Erreur
pour : connexion Supabase (base), stockage Supabase (bucket
`call-recordings`), connexion Twilio (+ type de compte trial/full),
configuration des webhooks (Voice URL / Status Callback compares a ce qui
est attendu pour chaque numero de `company_phone_numbers`), connexion
Claude, connexion ElevenLabs, et variables d'environnement (detection de
valeurs qui ressemblent a des placeholders oublies). Reservee aux
owners/admins (`src/lib/diagnostics/checks.ts`).

### Journal systeme (`/logs`)

Trace chronologique (plus recent en premier) de tous les evenements
techniques d'un appel, lus depuis `call_logs` avec RLS (chaque entreprise
ne voit que ses propres logs) : appel recu, chaque webhook Twilio recu,
reponse IA generee, transcription enregistree, resume genere, erreurs, et
(a partir de l'etape 4) notifications envoyees — la convention de nommage
`notification.sent` / `notification.failed` est deja prevue pour ce futur
usage, mais aucun code n'envoie encore de notification a ce stade.

### Mode Test (`Parametres > Mode Test`)

Une fois active pour une entreprise (`settings.test_mode`), chaque etape
d'un appel journalise le temps d'execution du fournisseur concerne
(Twilio, Claude, ElevenLabs, Supabase) via `src/lib/calls/timing.ts`
(`withTiming`), sous forme d'entrees `test_mode.timing` dans le Journal
systeme (niveau debug, avec `durationMs` en metadata). Sans overhead
quand desactive (le mode par defaut). A activer avant le premier appel de
test reel, puis desactiver pour ne pas polluer les logs en production.

## Mode Simulation (`/test-call`)

Demontre le produit sans dependre d'un compte Twilio payant : rejoue toute
la boucle **conversation IA -> collecte d'informations -> resume ->
creation client -> historique**, en reutilisant exactement le meme code
que le pipeline Twilio reel (`getAIProvider()`, `getCompanyAIContext()`,
`finalizeCall()`) — seule la "porte d'entree" change (Server Action au
lieu d'un webhook Twilio). Brancher un jour un vrai flux Twilio
supplementaire (au-dela du `<Gather>` actuel) ne necessitera donc pas de
refonte de la logique IA/finalisation, deja partagee.

- **Scenarios** (`src/lib/ai/scenarios.ts`) : Demande de devis, Prise de
  rendez-vous, Demande d'information, Urgence, Client mecontent. Chaque
  scenario ajoute une instruction au contexte IA (reutilise le mecanisme
  existant des "questions specifiques au metier") et suggere un premier
  message client pour demarrer rapidement.
- **Moteur** (`src/lib/simulation/engine.ts`) : `startSimulation` cree la
  ligne `calls` (`is_simulated = true`, `from_number` genere de facon
  unique par session, `to_number` = le numero principal de l'entreprise
  s'il existe sinon `"Simulation"`) ; `continueSimulation` boucle la
  conversation (meme limite
  `MAX_CUSTOMER_TURNS` que le pipeline reel) ; `endSimulationNow` permet de
  clore manuellement. La finalisation appelle `finalizeCall()` sans
  modification.
- **Securite** : les Server Actions (`src/lib/actions/simulation.ts`)
  verifient d'abord l'entreprise de l'utilisateur connecte
  (`getCurrentUserCompany()`, respecte RLS) avant d'utiliser le
  `service_role` pour ecrire — aucune nouvelle policy RLS necessaire sur
  `calls` (toujours ecrit uniquement par du code serveur de confiance).
- **Historique** : les appels simules apparaissent dans `/calls` et
  `/calls/[id]` avec un badge "Simulation", et un lecteur audio fictif
  (`FakeAudioPlayer`) a la place d'un vrai enregistrement — la structure
  (`call_recordings.storage_path`) est deja prete a recevoir un jour un
  vrai enregistrement Twilio sans changement de schema.
- **Exclu des metriques reelles** : les simulations ne comptent ni dans
  les statistiques du tableau de bord (appels du jour, urgences, duree
  moyenne, nouveaux clients) ni dans le quota mensuel du plan
  (`get_company_usage()`). Le filtre "nouveaux clients" exclut les
  numeros `Simulation-...` (la table `customers` n'a pas de colonne
  `is_simulated` : ce prefixe de `phone_number` sert de marqueur) ;
  limitation residuelle acceptee, si le client simule au fil de la
  conversation communique un numero qui ressemble a un vrai numero, il
  sera compte comme un nouveau client reel.
- **Logs** : `simulation.started`, `simulation.message` (client et
  assistant, differencies par `metadata.role`), `simulation.completed`,
  visibles dans le Journal systeme comme les vrais appels.
- **Champ Email** : ajoute a `customers` et `CallSummary` (absent du
  schema initial), car demande par le mode simulation — desormais
  collecte aussi sur les vrais appels quand le client le communique.
- **Identifiant unique par session** : `from_number` est genere
  aleatoirement (`Simulation-xxxxxxxx`) a chaque simulation plutot que
  fixe, pour que chaque demo cree reellement un nouveau client (sauf si
  le client simule communique un numero, qui prend alors le dessus) —
  important pour rejouer la demo plusieurs fois de facon credible.

### Experience de demonstration commerciale

- **Pendant l'appel** (`/test-call`) : bandeau "Appel en cours" (pastille
  animee), duree ecoulee, nombre de questions posees, indicateur de frappe
  pendant que l'IA repond, et une progression de collecte des informations
  (`src/lib/simulation/progress.ts`) — **estimation heuristique par
  mots-cles**, affichee en direct pour le cote visuel ; l'extraction qui
  fait foi reste celle de Claude a la finalisation (`CallSummary`).
- **Fiche resultat** (`CallResultCard`) : synthese "Appel termine" (client,
  telephone, email, motif, urgence, resume, action recommandee).
- **Score de qualification prospect** (`CallSummary.qualificationScore`,
  0-100, `calls.qualification_score`) : genere par Claude a partir de
  l'urgence, la completude des informations, l'intention d'achat percue et
  la disponibilite. Colonne partagee entre simulation et vrais appels
  (`finalizeCall()` la persiste dans les deux cas) : aucune migration
  supplementaire ne sera necessaire pour l'exploiter sur de vrais appels.
- **Vue "Client cree"** (`CustomerCreatedCard`) : `finalizeCall()` retourne
  desormais `{ customerId, isNewCustomer, summary }` (au lieu de `void`,
  sans casser les appelants existants qui ignorent deja la valeur de
  retour) pour afficher "Nouveau client ajoute" vs "Client existant mis a
  jour", avec l'historique des appels de ce client.
- **Dashboard** : carte "Appels IA traites" (`getAICallsSummary()`) avec
  le nombre d'appels reels et simules affiches separement, plus un temps
  economise estime (**hypothese illustrative de 5 min/appel reel, pas une
  mesure**, voir le commentaire dans `src/lib/data/dashboard.ts`).
- **Page commerciale publique** (`/demo`, ajoutee aux routes publiques du
  middleware) : argumentaire produit + bouton "Tester une conversation IA"
  vers `/test-call`. **Point d'attention** : `/test-call` reste protegee
  par l'authentification (comme le reste du dashboard) — un visiteur non
  connecte sera redirige vers `/login` en cliquant le bouton. Rendre
  `/test-call` public serait une decision separee (cout des appels
  Claude/ElevenLabs expose a des visiteurs anonymes), non prise ici.

## Personnalisation de l'assistant IA (`Parametres > Assistant IA`)

Chaque entreprise configure entierement son propre assistant sans jamais
ecrire de prompt : deux entreprises utilisant la plateforme peuvent avoir
deux assistants completement differents (ton, questions, objectifs,
horaires, FAQ), le tout assemble dynamiquement en un prompt systeme par
`buildSystemPrompt()`.

- **Page `/settings/assistant`** (6 onglets, `src/components/settings/assistant/`) :
  - *Informations generales* : nom de l'entreprise, secteur d'activite
    (liste fermee : Plomberie, Chauffage, Climatisation, Garage,
    Serrurerie, Electricite, Immobilier, Cabinet medical, Autre), ton
    (professionnel/chaleureux/premium/direct), langue.
  - *Message d'accueil* : modele editable avec le jeton `{{entreprise}}`,
    **apercu en temps reel** du message final.
  - *Questions obligatoires* : ajout/suppression/reordre (fleches
    haut/bas)/activation par question ; l'ordre du tableau est l'ordre
    utilise pendant l'appel.
  - *Objectifs de l'appel* : selection multiple (rendez-vous,
    qualification, devis, transfert si urgence, simple prise de message).
  - *Horaires* : grille des 7 jours (active/horaires), jours feries,
    mode vacances (avec message dedie) ; stocke sur `companies.business_hours`
    (colonne existante depuis l'etape 2, jusqu'ici inutilisee).
  - *FAQ* : questions/reponses libres, utilisees par le prompt (et plus
    tard exploitables telles quelles par Claude pour repondre a des
    questions frequentes sans reformuler).
- **`getCompanyAIContext(companyId)`** (`src/lib/calls/context.ts`) :
  point d'entree unique, reecrit pour s'auto-suffire (un seul argument,
  il recharge lui-meme entreprise/parametres/FAQ) — utilise par les
  webhooks Twilio (`/api/voice/*`) et par le mode simulation
  (`src/lib/simulation/engine.ts`) sans aucune autre modification que la
  signature d'appel : **le mode simulation profite donc immediatement des
  nouvelles options**, comme le pipeline Twilio reel.
- **`buildSystemPrompt()`** (`src/lib/ai/prompt-builder.ts`) : fonction
  pure, independante du SDK Claude, qui transforme `CompanyAIContext` en
  prompt texte (identite + ton + langue + objectifs + questions
  activees + FAQ + horaires/vacances + consignes generales). Le prompt
  n'est jamais visible ni redige par l'utilisateur.
- **Horaires** (`src/lib/calls/business-hours.ts`) : `evaluateBusinessHours()`
  utilise `Intl.DateTimeFormat` (aucune dependance ajoutee) pour
  determiner si l'entreprise est actuellement ouverte, avec priorite
  mode vacances > jours feries > horaires hebdomadaires. Hors horaires,
  l'IA adapte automatiquement son discours (n'annonce jamais de
  rendez-vous immediat, precise que le message sera transmis).
- **Stockage Supabase** (migration `20260811090000_assistant_customization.sql`) :
  `settings.assistant_questions` (remplace `custom_questions`, desormais
  un tableau d'objets `{id, label, required, enabled}` au lieu de simples
  chaines — les entreprises existantes sont migrees automatiquement vers
  ce format), `settings.tone`, `settings.language`, `settings.call_goals`,
  et une nouvelle table `faq_entries` (RLS multi-tenant, meme politique
  que `settings`). Aucune nouvelle table pour les horaires : reutilise
  `companies.business_hours`/`companies.timezone`, deja presents.
- **Validation** : chaine complete des migrations rejouee sur un Postgres
  local (schema `auth`/`storage` reconstitue a la main, Docker toujours
  indisponible dans cet environnement), y compris la conversion des
  donnees existantes (anciennes questions "chaine de caracteres" ->
  nouveau format objet). Deux entreprises fictives (une plomberie en ton
  direct, un cabinet medical en ton chaleureux et en mode vacances) ont
  ete inserees avec des configurations tres differentes, puis
  `getCompanyAIContext()`/`buildSystemPrompt()` (le vrai code de
  production) executes dessus pour verifier que les deux prompts
  systeme resultants different reellement (ton, objectifs, questions
  activees uniquement, FAQ, gestion des horaires/vacances) — voir le
  detail dans le message de livraison de cette fonctionnalite.

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

### Configurer un numero Twilio pour un premier test reel

Voir **`docs/TWILIO_SETUP.md`** pour la checklist complete (variables
d'environnement exactes, URLs de webhooks, permissions, limitations
trial vs production). Resume rapide :

1. Ajouter le numero dans `company_phone_numbers` (associe a une
   entreprise existante).
2. Sur la console Twilio, configurer ce numero :
   - **A Call Comes In** (Voice URL) : `POST {NEXT_PUBLIC_APP_URL}/api/voice/incoming`
   - **Call Status Changes** : `POST {NEXT_PUBLIC_APP_URL}/api/voice/status`
3. Configurer le renvoi d'appel conditionnel de l'entreprise (no answer /
   busy / hors horaires) vers ce numero Twilio.
4. Verifier la page `/diagnostics` du dashboard avant de decrocher.

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
2. **Etape 2** — authentification, schema de base de donnees complet +
   Row Level Security, dashboard connecte aux vraies donnees.
3. **Etape 3** — reception des appels Twilio transferes, conversation IA
   (Claude + Gather/TTS), enregistrement audio, sauvegarde complete dans
   Supabase. **A confirmer par un premier appel telephonique reel** (voir
   ci-dessous).
3.5. **Etape 3.5** — outillage de validation : checklist Twilio
   (`docs/TWILIO_SETUP.md`), page Diagnostic, Journal systeme, Mode Test.
   L'etape 3 sera consideree definitivement close des qu'un vrai appel
   aura ete passe avec succes en utilisant ces outils.
3.6. **Mode Simulation** — demo complete du produit sans Twilio
   (`/test-call`), pour continuer a avancer sur le produit sans dependre
   d'un compte Twilio payant pendant que l'appel reel de l'etape 3.5
   n'est pas encore passe.
3.7. **Personnalisation de l'assistant IA (cette livraison)** —
   `Parametres > Assistant IA`, chaque entreprise configure son propre
   assistant (ton, questions, objectifs, horaires, FAQ) sans ecrire de
   prompt ; le mode simulation et le pipeline Twilio reel en profitent
   tous les deux immediatement.
4. **Etape 4** — resume IA (deja produit a l'etape 3, a affiner),
   notifications (email par defaut, SMS/WhatsApp optionnels) declenchees
   automatiquement a la fin de l'appel.
5. **Etape 5** — historique des appels (recherche/filtres/tri), fiche
   appel deja fonctionnelle (audio + transcription + resume, etape 2) a
   enrichir, deploiement.
