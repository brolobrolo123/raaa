import Link from "next/link";
import { cn } from "@/lib/cn";

interface LogoProps {
  asLink?: boolean;
  className?: string;
}

export function Logo({ asLink = true, className }: LogoProps) {
  const glyph = (
    <span
      className={cn(
        "flex flex-col leading-tight text-white",
        className,
      )}
    >
      <span className="text-sm font-semibold uppercase tracking-[0.45em] text-cyan-300/80">Archivo vivo</span>
        <span className="text-2xl font-semibold tracking-tight">
        Teoría
        <span className="ml-2 bg-linear-to-r from-cyan-300 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
          Colectiva
        </span>
      </span>
    </span>
  );

  if (!asLink) {
    return glyph;
  }

  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500/20 via-fuchsia-500/10 to-indigo-500/20 text-lg font-bold text-cyan-200">
        <span className="absolute inset-0 rounded-2xl border border-cyan-300/30" />
        <span className="relative tracking-[0.3em] text-xs uppercase">TC</span>
      </span>
      {glyph}
    </Link>
  );
}
