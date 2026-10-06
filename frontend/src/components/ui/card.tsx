import clsx from "clsx";
import type { ReactNode } from "react";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx("rounded-xl bg-white shadow-sm ring-1 ring-slate-200", className)}>
      {children}
    </div>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200"
    >
      {children}
    </div>
  );
}
