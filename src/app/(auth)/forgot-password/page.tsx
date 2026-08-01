import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mot de passe oublie</CardTitle>
        <CardDescription>
          Nous vous enverrons un lien de reinitialisation par email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Link href="/login" className="text-sm text-muted-foreground hover:underline">
          Retour a la connexion
        </Link>
      </CardFooter>
    </Card>
  );
}
