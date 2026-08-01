import Link from "next/link";
import { PhoneCall, Sparkles, Clock, UserCheck, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const highlights = [
  {
    icon: Clock,
    title: "Disponible 24h/24",
    description:
      "Aucun appel manque : l'assistant IA repond des que l'entreprise ne peut pas decrocher.",
  },
  {
    icon: UserCheck,
    title: "Qualifie chaque client",
    description:
      "Nom, coordonnees, motif, urgence et disponibilite recueillis naturellement, sans questionnaire rigide.",
  },
  {
    icon: FileText,
    title: "Resume instantane",
    description:
      "Un resume clair et une action recommandee, prets a etre lus en quelques secondes.",
  },
];

export default function DemoPage() {
  return (
    <div className="flex-1">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <PhoneCall className="size-5" />
            CallFlow AI
          </Link>
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
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
            <Sparkles className="size-4" />
            Demonstration interactive
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Votre assistant IA repond a vos appels 24h/24, qualifie vos
            clients et vous envoie un resume instantane.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Testez une conversation complete avec l&apos;assistant : choisissez
            un scenario (devis, urgence, rendez-vous...) et voyez exactement
            ce que vivrait un de vos clients au telephone.
          </p>
          <div className="flex gap-3">
            <Button size="lg" asChild>
              <Link href="/test-call">Tester une conversation IA</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Demarrer avec mon entreprise</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 pb-24 sm:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <CardHeader>
                  <Icon className="size-5 text-primary" />
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
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
