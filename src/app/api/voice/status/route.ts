import { NextResponse } from "next/server";

/**
 * Webhook Twilio "Status Callback" (ringing, in-progress, completed...).
 * La persistance en base (table `calls`) est branchee a l'etape 3.
 */
export async function POST() {
  return NextResponse.json({ received: true });
}
