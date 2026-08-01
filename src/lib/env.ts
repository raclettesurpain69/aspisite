import { z } from "zod";

/**
 * Variables d'environnement validees au demarrage. Toute variable absente
 * ou mal formee fait echouer le build/serveur immediatement plutot que de
 * provoquer une erreur silencieuse plus tard (ex: appel Twilio qui echoue
 * en production faute de credentials).
 *
 * Les variables prefixees NEXT_PUBLIC_ sont exposees au navigateur: ne
 * jamais y placer de secret. Tout le reste n'est lu que cote serveur.
 *
 * Important: Next.js n'inline les NEXT_PUBLIC_* dans le bundle navigateur
 * que si `process.env.NEXT_PUBLIC_X` est reference litteralement (pas via
 * un objet ou une boucle). D'ou la double liste explicite ci-dessous.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

function parseOrThrow<T extends z.ZodTypeAny>(schema: T, values: unknown) {
  const result = schema.safeParse(values);
  if (!result.success) {
    console.error(
      "Variables d'environnement invalides:",
      result.error.flatten()
    );
    throw new Error(
      "Configuration invalide: verifiez votre fichier .env.local (voir .env.example)."
    );
  }
  return result.data as z.infer<T>;
}

const isServer = typeof window === "undefined";

const publicEnv = parseOrThrow(clientSchema, clientEnv);

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  ANTHROPIC_API_KEY: z.string().min(1),

  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().min(1),

  // Transcription (Whisper ou equivalent) et synthese vocale (TTS).
  // Fournisseurs separables de l'IA conversationnelle (Claude) pour
  // permettre de les remplacer independamment.
  OPENAI_API_KEY: z.string().min(1),
  ELEVENLABS_API_KEY: z.string().min(1),

  RESEND_API_KEY: z.string().min(1),
  NOTIFICATION_EMAIL_FROM: z.string().email(),
});

const serverEnv = isServer
  ? parseOrThrow(serverSchema, process.env)
  : ({} as z.infer<typeof serverSchema>);

export const env = { ...publicEnv, ...serverEnv };
