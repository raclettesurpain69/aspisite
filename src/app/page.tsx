import Link from "next/link";
import { PhoneCall } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Ne perdez plus aucun appel",
    description:
      "Quand vous ne repondez pas, l'IA prend le relais et recueille les informations du client a votre place.",
  },
  {
    title: "Votre numero, inchange",
    description:
      "Un simple renvoi d'appel conditionnel suffit. Aucun changement d'operateur ni de numero.",
  },
  {
    title: "Un resume clair par appel",
    description:
      "Nom, coordonnees, motif et urgence, envoyes par email des la fin de l'appel.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex-1">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2 font-semibold">
            <PhoneCall className="size-5" />
            CallFlow AI
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Essayer gratuitement</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="flex flex-col items-start gap-6 py-24">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            La secretaire IA qui repond au telephone quand vous ne pouvez pas.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            CallFlow AI prend en charge vos appels manques, discute avec vos
            clients et vous envoie un resume pret a l&apos;emploi. Votre
            numero actuel ne change pas.
          </p>
          <div className="flex gap-3">
            <Button size="lg" asChild>
              <Link href="/register">Demarrer maintenant</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">J&apos;ai deja un compte</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 pb-24 sm:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} CallFlow AI. Tous droits reserves.
        </div>
      </footer>
    </div>
  );
}
