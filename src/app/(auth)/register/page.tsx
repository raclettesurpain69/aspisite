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

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Creer votre compte</CardTitle>
        <CardDescription>
          Configurez votre secretaire IA en quelques minutes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Formulaire branche a Supabase Auth a l'etape 2 */}
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
            <Input
              id="companyName"
              name="companyName"
              autoComplete="organization"
              placeholder="Plomberie Dupont"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email professionnel</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@entreprise.fr"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Creer mon compte
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2 border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Deja un compte ?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Se connecter
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
