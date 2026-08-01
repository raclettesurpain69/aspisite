import { logCallEvent } from "@/lib/calls/log";

/**
 * Chronometre un appel a un fournisseur externe (Twilio, Claude,
 * ElevenLabs, Supabase) et journalise sa duree dans call_logs quand le
 * Mode Test est actif (src/lib/actions/settings.ts,
 * settings.test_mode). N'ajoute aucun overhead si le mode est desactive :
 * appelle directement `fn()` sans mesurer ni journaliser.
 */
export async function withTiming<T>(
  params: {
    testMode: boolean;
    companyId: string | null;
    callId: string | null;
    provider: string;
    action: string;
  },
  // PromiseLike (pas Promise) pour accepter aussi les query builders
  // Supabase, thenables mais pas des Promise au sens strict de TypeScript.
  fn: () => PromiseLike<T>
): Promise<T> {
  if (!params.testMode) {
    return Promise.resolve(fn());
  }

  const startedAt = Date.now();

  try {
    const result = await fn();
    const durationMs = Date.now() - startedAt;
    await logCallEvent({
      companyId: params.companyId,
      callId: params.callId,
      level: "debug",
      eventType: "test_mode.timing",
      message: `[Mode test] ${params.provider} / ${params.action} : ${durationMs} ms`,
      metadata: { provider: params.provider, action: params.action, durationMs, success: true },
    });
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    await logCallEvent({
      companyId: params.companyId,
      callId: params.callId,
      level: "warn",
      eventType: "test_mode.timing",
      message: `[Mode test] ${params.provider} / ${params.action} a echoue apres ${durationMs} ms`,
      metadata: { provider: params.provider, action: params.action, durationMs, success: false },
    });
    throw error;
  }
}
