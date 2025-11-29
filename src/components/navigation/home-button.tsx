"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useCallback, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/lib/i18n/client";

interface HomeButtonProps {
  className?: string;
  href?: string;
  label?: string;
  expanded?: boolean;
}

export function HomeButton({ className, href = "/hub", label, expanded = false }: HomeButtonProps) {
  const t = useTranslations();
  const resolvedLabel = label ?? t("common.homeLabel");
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }
      event.preventDefault();
      window.location.assign(href);
    },
    [href],
  );

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={handleClick}
      className={cn(
        "group inline-flex h-11 items-center justify-center overflow-hidden rounded-full border border-cyan-300/30 bg-white/5 text-white shadow-[0_15px_35px_rgba(2,6,23,0.65)] backdrop-blur transition-all duration-500",
        expanded ? "px-5" : "w-12",
        !expanded && "hover:w-24 hover:border-fuchsia-300/60 hover:bg-white/15",
        className,
      )}
      aria-label={`Ir a ${resolvedLabel}`}
    >
      <Home className="h-4 w-4 text-cyan-200" />
      <span
        className={cn(
          "ml-2 text-sm font-semibold text-white transition-all duration-500",
          expanded ? "max-w-28 opacity-100" : "max-w-0 overflow-hidden opacity-0 group-hover:max-w-20 group-hover:opacity-100",
        )}
      >
        {resolvedLabel}
      </span>
    </Link>
  );
}
