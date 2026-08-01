import Link from "next/link";
import { PhoneCall } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-16">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold"
      >
        <PhoneCall className="size-5" />
        CallFlow AI
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
