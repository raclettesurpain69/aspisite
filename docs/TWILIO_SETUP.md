# Configurer Twilio pour un premier appel de test reel

Ce guide couvre tout ce qu'il faut pour tester le systeme telephonique
avec un vrai numero Twilio et un vrai appel. A suivre dans l'ordre.

## 1. Prerequis

- Un compte Twilio (https://www.twilio.com/try-twilio) — un compte
  d'essai (trial) suffit pour un premier test, voir [limitations](#4-limitations-du-compte-trial-vs-production).
- Un numero de telephone Twilio Voice (achete depuis la console ou via
  l'API). Un numero francais (+33) n'est pas obligatoire pour tester : un
  numero US/UK gratuit d'un compte trial fonctionne, seul le renvoi
  d'appel de l'entreprise doit pouvoir le composer.
- L'application deployee sur une URL HTTPS publique (Vercel, ou un tunnel
  type `ngrok`/`cloudflared` en local — Twilio ne peut pas appeler
  `http://localhost:3000` directement).
- Les cles API Anthropic (Claude), OpenAI, ElevenLabs et Resend (voir
  `.env.example`).

## 2. Variables d'environnement exactes

A renseigner dans `.env.local` (local) ou les variables d'environnement
de votre plateforme de deploiement (production) :

| Variable | Ou la trouver | Exemple |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Console Twilio > Account Info | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Console Twilio > Account Info (bouton "Show") | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_PHONE_NUMBER` | Numero Twilio achete, utilise pour les SMS/WhatsApp de notification (pas pour la voix, voir section 3) | `+15551234567` |
| `NEXT_PUBLIC_APP_URL` | L'URL HTTPS publique de votre app | `https://votre-app.vercel.app` |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys | `sk-ant-...` |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | `sk-...` |
| `ELEVENLABS_API_KEY` | https://elevenlabs.io/app/settings/api-keys | `...` |
| `RESEND_API_KEY` | https://resend.com/api-keys | `re_...` |
| `NOTIFICATION_EMAIL_FROM` | Domaine verifie dans Resend | `notifications@votredomaine.fr` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Console Supabase > Project Settings > API | — |

Toutes ces variables sont validees au demarrage par `src/lib/env.ts` : une
valeur manquante ou vide fait echouer le build/serveur immediatement.

> Une valeur qui "ressemble" a un placeholder (ex: contient `placeholder`,
> `xxxx`, `example.com`) passe la validation Zod (qui ne verifie que le
> format) mais sera signalee par la page **Diagnostic** du dashboard.

## 3. URLs de webhooks a configurer

Sur la console Twilio (**Phone Numbers > Manage > Active Numbers >
[votre numero]**), section **Voice Configuration** :

| Champ Twilio | Valeur |
|---|---|
| Configure with | Webhook, TwiML Bin, Function, Studio Flow, Proxy Service → choisir **Webhook** |
| A CALL COMES IN | `POST` `{NEXT_PUBLIC_APP_URL}/api/voice/incoming` |
| Call status changes | `POST` `{NEXT_PUBLIC_APP_URL}/api/voice/status` |

Remplacer `{NEXT_PUBLIC_APP_URL}` par la valeur exacte de la variable
d'environnement (ex: `https://votre-app.vercel.app`).

Les deux autres webhooks (`/api/voice/say`, `/api/voice/gather`,
`/api/voice/recording-status`) **ne se configurent pas dans la console** :
ils sont references dynamiquement dans le TwiML genere par
`/api/voice/incoming` et `/api/voice/gather`, et le callback
d'enregistrement est enregistre automatiquement par
`TelephonyProvider.startCallRecording()` a chaque appel.

## 4. Associer le numero a une entreprise

Le numero Twilio doit exister dans la table `company_phone_numbers` pour
que `/api/voice/incoming` puisse identifier l'entreprise :

```sql
insert into public.company_phone_numbers (company_id, phone_number, label)
values ('<uuid-de-l-entreprise>', '+15551234567', 'Numero de test');
```

Le format doit etre E.164 (`+` puis indicatif pays, sans espaces), exactement
comme Twilio l'envoie dans le champ `To` du webhook.

## 5. Permissions necessaires

- **Cote Twilio** : le compte doit avoir le produit **Voice** active sur le
  numero (par defaut a l'achat). Aucune permission supplementaire cote
  API n'est requise pour recevoir des appels entrants.
- **Geo permissions** (comptes trial et certains comptes payants) : si le
  numero appelant (celui de l'entreprise qui teste) est dans un pays
  different de celui du numero Twilio, verifier **Voice > Settings >
  Geographic Permissions** et activer le pays concerne.
- **Cote entreprise testee** : configurer le renvoi d'appel conditionnel
  (occupe / pas de reponse / injoignable) de la ligne professionnelle vers
  le numero Twilio. Cette configuration se fait sur le telephone/standard
  de l'entreprise (ou aupres de son operateur), pas dans ce projet.

## 6. Limitations du compte Trial vs Production

| | Compte **Trial** | Compte **Full** (carte bancaire ajoutee) |
|---|---|---|
| Numeros appelants autorises | Uniquement les numeros **verifies** dans Console > Phone Numbers > Verified Caller IDs | N'importe quel numero |
| Message injecte | Un message "You have a trial account..." est joue avant que votre TwiML ne s'execute | Aucun |
| Solde | Credit d'essai limite (quelques dollars) | Facturation a l'usage |
| Numeros achetables | Un seul numero gratuit inclus, achats supplementaires payants | Illimite (selon solde) |
| Geo permissions | Souvent restreintes par defaut | Configurables librement |

**Pour un premier test reel avec un compte trial** : verifiez d'abord le
numero appelant (celui du telephone qui va composer/etre renvoye vers le
numero Twilio) dans **Console > Phone Numbers > Manage > Verified Caller
IDs**, sinon Twilio rejettera l'appel avant meme qu'il n'atteigne votre
webhook. Le message d'avertissement trial n'empeche pas le test, il
rallonge juste legerement l'appel.

## 7. Checklist finale avant de decrocher

- [ ] `.env.local` (ou variables de production) completes avec les vraies
      valeurs (pas de `placeholder`).
- [ ] Numero Twilio achete, Voice actif.
- [ ] Webhook "A call comes in" -> `/api/voice/incoming` (methode `POST`).
- [ ] Webhook "Call status changes" -> `/api/voice/status` (methode `POST`).
- [ ] Numero present dans `company_phone_numbers` avec le bon
      `company_id`.
- [ ] Ligne `settings` existe pour cette entreprise (creee automatiquement
      a l'inscription).
- [ ] Si compte trial : numero appelant verifie dans Twilio.
- [ ] Application accessible publiquement en HTTPS (pas de localhost nu).
- [ ] Page **Diagnostic** du dashboard entierement au vert (voir
      `/diagnostics`).
- [ ] **Mode Test** active dans Parametres pour capturer les temps
      d'execution du premier appel (voir Journal systeme).

Une fois tout coche : appelez le numero de l'entreprise (ou directement le
numero Twilio pour un test plus rapide sans dependre du renvoi d'appel) et
suivez le deroulement dans `/logs` (Journal systeme) en temps quasi-reel.
