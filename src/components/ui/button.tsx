"use client";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold tracking-wide transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-linear-to-r from-fuchsia-500/90 via-indigo-500/90 to-cyan-400/90 text-white shadow-[0_15px_35px_rgba(14,165,233,0.35)] hover:shadow-[0_20px_45px_rgba(8,145,178,0.45)] focus-visible:outline-cyan-400",
  secondary:
    "border border-cyan-300/60 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20 hover:border-cyan-200 focus-visible:outline-cyan-300",
  outline:
    "border border-white/40 text-white hover:border-fuchsia-300 hover:text-fuchsia-100 focus-visible:outline-fuchsia-400",
  ghost:
    "text-slate-200 hover:text-white hover:bg-white/5 focus-visible:outline-slate-200",
};

export function Button({
  className,
  variant = "primary",
  loading = false,
  fullWidth,
  asChild = false,
  children,
  type = "button",
  ...props
}: Props) {
  const Component = asChild ? Slot : "button";
  const disabled = props.disabled || loading;

  const sharedProps = {
    className: cn(
      baseStyles,
      variantStyles[variant],
      fullWidth ? "w-full" : "px-5 py-2.5",
      disabled ? "opacity-40 cursor-not-allowed" : "",
      className,
    ),
    ...props,
  } as ButtonHTMLAttributes<HTMLButtonElement>;

  if (asChild) {
    return <Component {...sharedProps}>{loading ? "Procesando..." : children}</Component>;
  }

  return (
    <Component {...sharedProps} type={type} disabled={disabled}>
      {loading ? "Procesando..." : children}
    </Component>
  );
}
