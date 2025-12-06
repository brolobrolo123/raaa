import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-4xl border border-white/10 bg-linear-to-br from-white/5 via-purple-900/10 to-cyan-900/5 p-6 text-white shadow-[0_30px_60px_rgba(0,0,0,0.55)]",
        className,
      )}
      {...props}
    />
  );
}
