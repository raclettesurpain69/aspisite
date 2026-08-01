import { Button } from "@/components/ui/button";

export function Topbar({ title }: { title: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      {/* Menu utilisateur (deconnexion, entreprise) branche a l'etape 2 */}
      <Button variant="outline" size="sm">
        Mon compte
      </Button>
    </header>
  );
}
