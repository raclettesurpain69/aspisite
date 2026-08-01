import { Topbar } from "@/components/layout/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const sections = [
  {
    title: "Informations entreprise",
    description: "Nom, logo, secteur, adresse, email, horaires d'ouverture.",
  },
  {
    title: "Configuration IA",
    description:
      "Message d'accueil personnalise, questions par metier, type d'activite.",
  },
  {
    title: "Notifications",
    description: "Email (par defaut), SMS, WhatsApp.",
  },
];

export default function SettingsPage() {
  return (
    <>
      <Topbar title="Parametres" />
      <main className="flex-1 space-y-6 p-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-6 text-sm text-muted-foreground">
              Disponible a l&apos;etape 2 (table `settings`).
            </CardContent>
          </Card>
        ))}
      </main>
    </>
  );
}
