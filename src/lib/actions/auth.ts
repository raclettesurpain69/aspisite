"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { env } from "@/lib/env";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/auth-state";

function firstIssueMessage(error: z.ZodError, fallback: string) {
  return error.issues[0]?.message ?? fallback;
}

const signUpSchema = z.object({
  companyName: z.string().trim().min(2, "Le nom de l'entreprise est trop court."),
  email: z.string().trim().email("Email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres."),
});

/**
 * Inscription : cree le compte Supabase Auth, puis (via le service role,
 * qui contourne RLS) l'entreprise et le rattachement owner du profil cree
 * automatiquement par le trigger `handle_new_user`. Les deux etapes sont
 * necessaires car un utilisateur Supabase Auth n'a pas encore d'entreprise
 * a la creation de son compte.
 */
export async function signUpAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error, "Formulaire invalide.") };
  }

  const { companyName, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: "Inscription incomplete, merci de reessayer." };
  }

  const serviceClient = createServiceRoleClient();

  const { data: company, error: companyError } = await serviceClient
    .from("companies")
    .insert({ name: companyName })
    .select("id")
    .single();

  if (companyError || !company) {
    return {
      error:
        "Votre compte a ete cree mais la creation de l'entreprise a echoue. Contactez le support.",
    };
  }

  const { error: profileError } = await serviceClient
    .from("users")
    .update({ company_id: company.id, role: "owner" })
    .eq("id", userId);

  if (profileError) {
    return {
      error:
        "Votre compte a ete cree mais le rattachement a l'entreprise a echoue. Contactez le support.",
    };
  }

  await serviceClient.from("settings").insert({ company_id: company.id });

  if (!data.session) {
    redirect("/login?registered=1");
  }

  redirect("/dashboard");
}

const signInSchema = z.object({
  email: z.string().trim().email("Email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

export async function signInAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error, "Formulaire invalide.") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email invalide."),
});

export async function requestPasswordResetAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error, "Email invalide.") };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=/reset-password`,
  });

  // Message generique que l'email existe ou non, pour eviter de reveler
  // quels emails ont un compte (enumeration).
  return {
    success:
      "Si un compte existe pour cet email, un lien de reinitialisation vient d'etre envoye.",
  };
}

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres."),
});

export async function updatePasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error, "Mot de passe invalide.") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: error.message };
  }

  redirect("/login");
}
