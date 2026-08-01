# CallFlow AI

Secretaire IA telephonique pour artisans et petites entreprises. Quand
l'entreprise ne peut pas repondre (occupe, pas de reponse, ferme), l'appel
est transfere vers cet assistant qui discute avec le client, recupere ses
informations et envoie un resume a l'entreprise.

Le SaaS ne remplace jamais le numero de l'entreprise : celle-ci configure un
simple renvoi d'appel conditionnel vers le numero Twilio de l'assistant.

> Statut : **Etape 1/5** — architecture, structure du projet, configuration
> et dependances. Aucune fonctionnalite metier n'est encore branchee (voir
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
    api/
      health/                   Health check
      voice/incoming/           Webhook Twilio Voice (appel transfere) — logique etape 3
      voice/status/             Webhook Twilio Status Callback — logique etape 3
      notifications/send/       Envoi du resume post-appel — logique etape 4
  components/
    ui/                         Primitives shadcn/ui (button, card, input...)
    layout/                     Sidebar, topbar du dashboard
  lib/
    supabase/                   Clients Supabase (browser, server, service role) + helper middleware
    ai/                         AIProvider (interface) + implementation Claude
    telephony/                  TelephonyProvider (interface) + implementation Twilio
    tts/                        TTSProvider (interface) + implementation ElevenLabs
    stt/                        STTProvider (interface) + implementation Whisper
    notifications/              Envoi email/SMS/WhatsApp + formatage du resume
    env.ts                      Validation Zod des variables d'environnement
  types/
    database.ts                 Types Supabase generes (placeholder, a regenerer a l'etape 2)
  middleware.ts                 Rafraichissement de session + protection des routes du dashboard
supabase/
  config.toml                   Configuration Supabase locale (CLI)
  migrations/                   Migrations SQL (etape 2)
  functions/                    Edge Functions (si besoin, non utilisees dans le MVP)
legacy-python-tool/              Ancien script Python de ce repo (sans rapport avec CallFlow AI, conserve tel quel)
```

## Multi-tenant et securite

- Chaque entreprise (`companies`) possede ses utilisateurs, clients, appels
  et parametres. L'isolation est assuree par **Row Level Security** Postgres
  (politiques definies a l'etape 2), pas seulement par la logique applicative.
- `src/lib/supabase/server.ts` expose deux clients : un client "utilisateur"
  (respecte RLS) et un client `service_role` reserve aux webhooks Twilio, qui
  n'ont pas de session utilisateur.
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

1. **Etape 1 (cette livraison)** — architecture, structure des dossiers,
   configuration Next.js/Supabase, dependances.
2. **Etape 2** — authentification (Supabase Auth), schema de base de
   donnees + Row Level Security, dashboard connecte aux vraies donnees.
3. **Etape 3** — reception des appels Twilio transferes, conversation IA
   en temps reel (Claude + TTS/STT).
4. **Etape 4** — transcription complete, resume IA structure,
   notifications (email par defaut, SMS/WhatsApp optionnels).
5. **Etape 5** — historique des appels (recherche/filtres/tri), fiche
   appel (audio + transcription + resume), deploiement.
