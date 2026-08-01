import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client Supabase pour Server Components, Server Actions et Route Handlers.
 * Doit etre recree a chaque requete (jamais reutilise entre requetes).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll est appele depuis un Server Component: ignore, la
            // session sera rafraichie par le middleware.
          }
        },
      },
    }
  );
}

/**
 * Client Supabase avec la service role key, reserve aux operations serveur
 * qui doivent contourner Row Level Security (ex: webhooks Twilio qui
 * n'ont pas de session utilisateur). Ne jamais importer cote client.
 */
export function createServiceRoleClient() {
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op: aucune session cote service role
        },
      },
    }
  );
}
