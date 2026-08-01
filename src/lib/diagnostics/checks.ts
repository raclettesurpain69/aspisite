import Anthropic from "@anthropic-ai/sdk";
import twilio from "twilio";

import { env } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { DiagnosticCheck, DiagnosticStatus } from "@/lib/diagnostics/types";

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function check(
  id: string,
  label: string,
  status: DiagnosticStatus,
  message: string,
  details?: string
): DiagnosticCheck {
  return { id, label, status, message, details };
}

/**
 * Ne verifie pas seulement la presence des variables (deja garantie par
 * src/lib/env.ts, qui empeche le serveur de demarrer sinon) mais detecte
 * les valeurs qui "ressemblent" a des placeholders oublies, cas frequent
 * lors d'une premiere configuration.
 */
export function checkEnvVars(): DiagnosticCheck {
  const looksLikePlaceholder = (value: string) =>
    /placeholder|xxxx|changeme|your[-_]?key|example\.com/i.test(value);

  const vars: Array<[string, string]> = [
    ["NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL],
    ["NEXT_PUBLIC_APP_URL", env.NEXT_PUBLIC_APP_URL],
    ["ANTHROPIC_API_KEY", env.ANTHROPIC_API_KEY],
    ["TWILIO_ACCOUNT_SID", env.TWILIO_ACCOUNT_SID],
    ["TWILIO_AUTH_TOKEN", env.TWILIO_AUTH_TOKEN],
    ["OPENAI_API_KEY", env.OPENAI_API_KEY],
    ["ELEVENLABS_API_KEY", env.ELEVENLABS_API_KEY],
    ["RESEND_API_KEY", env.RESEND_API_KEY],
  ];

  const suspicious = vars.filter(([, value]) => looksLikePlaceholder(value)).map(([name]) => name);

  if (suspicious.length > 0) {
    return check(
      "env",
      "Variables d'environnement",
      "warning",
      `${suspicious.length} variable(s) ressemble(nt) a une valeur de test oubliee.`,
      suspicious.join(", ")
    );
  }

  return check(
    "env",
    "Variables d'environnement",
    "ok",
    "Toutes les variables requises sont definies et ne ressemblent pas a des placeholders."
  );
}

export async function checkSupabaseDatabase(): Promise<DiagnosticCheck> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("subscription_plans").select("code").limit(1);
    if (error) throw new Error(error.message);
    return check("supabase_db", "Connexion Supabase (base de donnees)", "ok", "Requete de lecture reussie.");
  } catch (error) {
    return check(
      "supabase_db",
      "Connexion Supabase (base de donnees)",
      "error",
      "Impossible de lire la base de donnees.",
      toMessage(error)
    );
  }
}

export async function checkSupabaseStorage(): Promise<DiagnosticCheck> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.storage.getBucket("call-recordings");
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Le bucket 'call-recordings' est introuvable.");

    if (data.public) {
      return check(
        "supabase_storage",
        "Stockage Supabase (bucket call-recordings)",
        "warning",
        "Le bucket existe mais est public : il devrait etre prive (enregistrements audio confidentiels)."
      );
    }

    return check(
      "supabase_storage",
      "Stockage Supabase (bucket call-recordings)",
      "ok",
      "Bucket prive present et accessible."
    );
  } catch (error) {
    return check(
      "supabase_storage",
      "Stockage Supabase (bucket call-recordings)",
      "error",
      "Bucket introuvable ou inaccessible.",
      toMessage(error)
    );
  }
}

export async function checkTwilioConnection(): Promise<DiagnosticCheck> {
  try {
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    const account = await client.api.v2010.accounts(env.TWILIO_ACCOUNT_SID).fetch();

    if (account.type === "Trial") {
      return check(
        "twilio",
        "Connexion Twilio",
        "warning",
        `Compte connecte (${account.friendlyName}), mais en mode ESSAI : restrictions actives (numeros appelants non verifies rejetes, message d'avertissement injecte). Voir docs/TWILIO_SETUP.md.`
      );
    }

    return check(
      "twilio",
      "Connexion Twilio",
      "ok",
      `Compte connecte : ${account.friendlyName} (${account.type}, statut ${account.status}).`
    );
  } catch (error) {
    return check("twilio", "Connexion Twilio", "error", "Authentification Twilio echouee.", toMessage(error));
  }
}

export async function checkWebhookConfiguration(companyId: string): Promise<DiagnosticCheck> {
  try {
    const supabase = createServiceRoleClient();
    const { data: numbers } = await supabase
      .from("company_phone_numbers")
      .select("phone_number")
      .eq("company_id", companyId);

    if (!numbers || numbers.length === 0) {
      return check(
        "webhooks",
        "Configuration des webhooks Twilio",
        "warning",
        "Aucun numero Twilio associe a cette entreprise (table company_phone_numbers)."
      );
    }

    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    const expectedVoiceUrl = `${env.NEXT_PUBLIC_APP_URL}/api/voice/incoming`;
    const expectedStatusCallback = `${env.NEXT_PUBLIC_APP_URL}/api/voice/status`;

    const problems: string[] = [];

    for (const { phone_number } of numbers) {
      const results = await client.incomingPhoneNumbers.list({ phoneNumber: phone_number, limit: 1 });
      const twilioNumber = results[0];

      if (!twilioNumber) {
        problems.push(`${phone_number} : introuvable sur ce compte Twilio.`);
        continue;
      }
      if (twilioNumber.voiceUrl !== expectedVoiceUrl) {
        problems.push(
          `${phone_number} : Voice URL = "${twilioNumber.voiceUrl || "(vide)"}" au lieu de "${expectedVoiceUrl}".`
        );
      }
      if (twilioNumber.statusCallback !== expectedStatusCallback) {
        problems.push(
          `${phone_number} : Status Callback = "${twilioNumber.statusCallback || "(vide)"}" au lieu de "${expectedStatusCallback}".`
        );
      }
    }

    if (problems.length > 0) {
      return check(
        "webhooks",
        "Configuration des webhooks Twilio",
        "warning",
        `${problems.length} probleme(s) de configuration detecte(s) sur ${numbers.length} numero(s).`,
        problems.join("\n")
      );
    }

    return check(
      "webhooks",
      "Configuration des webhooks Twilio",
      "ok",
      `${numbers.length} numero(s) correctement configure(s) (Voice URL + Status Callback).`
    );
  } catch (error) {
    return check(
      "webhooks",
      "Configuration des webhooks Twilio",
      "error",
      "Impossible de verifier la configuration des numeros.",
      toMessage(error)
    );
  }
}

export async function checkClaudeConnection(): Promise<DiagnosticCheck> {
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const models = await client.models.list({ limit: 1 });
    const first = models.data[0];
    return check(
      "claude",
      "Connexion Claude (Anthropic)",
      "ok",
      first ? `API accessible (modele "${first.id}" disponible).` : "API accessible."
    );
  } catch (error) {
    return check(
      "claude",
      "Connexion Claude (Anthropic)",
      "error",
      "Authentification Anthropic echouee.",
      toMessage(error)
    );
  }
}

export async function checkElevenLabsConnection(): Promise<DiagnosticCheck> {
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return check("elevenlabs", "Connexion ElevenLabs", "ok", "API accessible.");
  } catch (error) {
    return check(
      "elevenlabs",
      "Connexion ElevenLabs",
      "error",
      "Authentification ElevenLabs echouee.",
      toMessage(error)
    );
  }
}

/**
 * Execute toutes les verifications en parallele. Chaque check avale ses
 * propres erreurs (jamais de rejet), donc Promise.all est sans risque ici.
 */
export async function runAllDiagnostics(companyId: string): Promise<DiagnosticCheck[]> {
  const [envCheck, database, storage, twilioConnection, webhooks, claude, elevenlabs] = await Promise.all([
    Promise.resolve(checkEnvVars()),
    checkSupabaseDatabase(),
    checkSupabaseStorage(),
    checkTwilioConnection(),
    checkWebhookConfiguration(companyId),
    checkClaudeConnection(),
    checkElevenLabsConnection(),
  ]);

  return [envCheck, database, storage, twilioConnection, webhooks, claude, elevenlabs];
}
