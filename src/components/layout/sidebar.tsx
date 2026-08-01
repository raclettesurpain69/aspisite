"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PhoneCall, Settings, Stethoscope, ScrollText, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/calls", label: "Appels", icon: PhoneCall },
  { href: "/test-call", label: "Tester un appel IA", icon: Sparkles },
  { href: "/diagnostics", label: "Diagnostic", icon: Stethoscope },
  { href: "/logs", label: "Journal systeme", icon: ScrollText },
  { href: "/settings", label: "Parametres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-background md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6 font-semibold">
        <PhoneCall className="size-5" />
        CallFlow AI
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
