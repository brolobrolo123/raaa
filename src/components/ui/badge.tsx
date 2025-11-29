import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: "accent" | "muted";
};

export function Badge({ className, tone = "accent", ...props }: Props) {
  const palette =
    tone === "accent"
      ? "bg-linear-to-r from-cyan-400/30 to-fuchsia-400/30 text-cyan-100 border border-cyan-200/40"
      : "bg-white/10 text-white/70 border border-white/20";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]",
        palette,
        className,
      )}
      {...props}
    />
  );
}
