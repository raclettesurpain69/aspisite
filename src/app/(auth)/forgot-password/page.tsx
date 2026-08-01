import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        {/* Branche a Supabase Auth (resetPasswordForEmail) a l'etape 2 */}
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@entreprise.fr"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Envoyer le lien
          </Button>
        </form>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Link href="/login" className="text-sm text-muted-foreground hover:underline">
          Retour a la connexion
        </Link>
      </CardFooter>
    </Card>
  );
}
