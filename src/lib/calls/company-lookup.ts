import { createServiceRoleClient } from "@/lib/supabase/server";

export type CompanyForCall = {
  id: string;
  name: string;
  businessType: string | null;
};

/**
 * Resout l'entreprise destinataire d'un appel entrant a partir du numero
 * appele (champ `To` du webhook Twilio). C'est ce qui permet a une meme
 * plateforme de servir plusieurs entreprises, chacune avec son propre
 * numero Twilio (table `company_phone_numbers`, N numeros par entreprise).
 * Utilise le service role : ce lookup se fait avant toute authentification
 * utilisateur (webhook Twilio non authentifie via Supabase Auth).
 */
export async function getCompanyByPhoneNumber(
  toNumber: string
): Promise<CompanyForCall | null> {
  const supabase = createServiceRoleClient();

  const { data: phoneNumber } = await supabase
    .from("company_phone_numbers")
    .select("company_id")
    .eq("phone_number", toNumber)
    .maybeSingle();

  if (!phoneNumber) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, business_type")
    .eq("id", phoneNumber.company_id)
    .maybeSingle();

  if (!company) return null;

  return { id: company.id, name: company.name, businessType: company.business_type };
}

/** Recharge les infos d'entreprise necessaires au contexte IA a partir de
 * son id (utilise par les tours de conversation suivants, qui ne
 * reçoivent que l'id de l'appel, pas le numero appele). */
export async function getCompanyById(companyId: string): Promise<CompanyForCall | null> {
  const supabase = createServiceRoleClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, business_type")
    .eq("id", companyId)
    .maybeSingle();

  if (!company) return null;

  return { id: company.id, name: company.name, businessType: company.business_type };
}
