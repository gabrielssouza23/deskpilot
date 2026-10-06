import { LifeBuoy } from "lucide-react";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 font-semibold tracking-tight text-slate-900"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <LifeBuoy className="size-5" aria-hidden />
      </span>
      DeskPilot
    </Link>
  );
}
