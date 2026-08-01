import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isTestModeEnabled } from "@/lib/calls/context";
import { logCallEvent } from "@/lib/calls/log";
import { withTiming } from "@/lib/calls/timing";
import { verifyTwilioRequest } from "@/lib/calls/verify-request";

/**
 * Webhook Twilio "Recording Status Callback", enregistre par
 * getTelephonyProvider().startCallRecording() a la creation de l'appel.
 * Telecharge l'audio depuis Twilio et le persiste dans le bucket prive
 * Supabase Storage `call-recordings` (jamais de bytes audio en base
 * PostgreSQL, voir call_recordings.storage_path).
 */
export async function POST(request: NextRequest) {
  const { valid, params } = await verifyTwilioRequest(request);
  if (!valid) {
    await logCallEvent({
      level: "error",
      eventType: "webhook.invalid_signature",
      message: "Signature Twilio invalide sur /api/voice/recording-status",
    });
    return new NextResponse("Invalid signature", { status: 403 });
  }

  if (params.RecordingStatus !== "completed") {
    return NextResponse.json({ received: true });
  }

  const callSid = params.CallSid;
  const recordingSid = params.RecordingSid;
  const recordingUrl = params.RecordingUrl;
  const durationSeconds = params.RecordingDuration
    ? Number.parseInt(params.RecordingDuration, 10)
    : null;

  const supabase = createServiceRoleClient();
  const { data: call } = await supabase
    .from("calls")
    .select("id, company_id")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  if (!call) {
    await logCallEvent({
      level: "warn",
      eventType: "recording.call_not_found",
      message: `Aucun appel trouve pour le CallSid ${callSid}`,
      metadata: { recordingSid },
    });
    return NextResponse.json({ received: true });
  }

  const testMode = await isTestModeEnabled(call.company_id);

  await logCallEvent({
    companyId: call.company_id,
    callId: call.id,
    eventType: "webhook.recording_status",
    message: `Callback enregistrement Twilio recu (statut : ${params.RecordingStatus})`,
  });

  try {
    const authHeader = Buffer.from(
      `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    const audioResponse = await withTiming(
      { testMode, companyId: call.company_id, callId: call.id, provider: "Twilio", action: "download_recording" },
      () => fetch(`${recordingUrl}.mp3`, { headers: { Authorization: `Basic ${authHeader}` } })
    );

    if (!audioResponse.ok) {
      throw new Error(`Telechargement de l'enregistrement echoue (${audioResponse.status})`);
    }

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const storagePath = `${call.company_id}/${call.id}.mp3`;

    const { error: uploadError } = await withTiming(
      { testMode, companyId: call.company_id, callId: call.id, provider: "Supabase", action: "storage_upload" },
      () =>
        supabase.storage
          .from("call-recordings")
          .upload(storagePath, audioBuffer, { contentType: "audio/mpeg", upsert: true })
    );

    if (uploadError) {
      throw new Error(`Upload Supabase Storage echoue : ${uploadError.message}`);
    }

    await supabase.from("call_recordings").upsert(
      {
        call_id: call.id,
        storage_bucket: "call-recordings",
        storage_path: storagePath,
        duration_seconds: durationSeconds,
        twilio_recording_sid: recordingSid,
      },
      { onConflict: "storage_bucket,storage_path" }
    );

    await logCallEvent({
      companyId: call.company_id,
      callId: call.id,
      eventType: "recording.saved",
      message: "Enregistrement audio sauvegarde dans Supabase Storage",
    });
  } catch (error) {
    await logCallEvent({
      companyId: call.company_id,
      callId: call.id,
      level: "error",
      eventType: "recording.save_failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return NextResponse.json({ received: true });
}
