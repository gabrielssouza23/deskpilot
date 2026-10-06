import clsx from "clsx";

import { initials } from "@/lib/format";

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700",
        className,
      )}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
