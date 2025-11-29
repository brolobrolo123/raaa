import { cn } from "@/lib/cn";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-3xl border border-cyan-200/30 bg-white/5 px-5 py-4 text-sm text-white placeholder:text-white/40 shadow-[0_10px_30px_rgba(2,6,23,0.45)] backdrop-blur focus:border-fuchsia-300/80 focus:outline-none focus:ring-2 focus:ring-fuchsia-300/40",
        className,
      )}
      {...props}
    />
  );
}
