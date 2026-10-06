import clsx from "clsx";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600",
  secondary:
    "bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-indigo-600",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-indigo-600",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-500 focus-visible:outline-rose-600",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
