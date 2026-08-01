import { NextResponse } from "next/server";

/**
 * Envoi du resume d'appel a l'entreprise (email par defaut, SMS/WhatsApp
 * optionnels). Branche aux providers de src/lib/notifications a l'etape 4.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Not implemented yet" },
    { status: 501 }
  );
}
