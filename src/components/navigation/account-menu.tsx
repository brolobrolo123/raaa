"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { UserAvatar } from "@/components/user/user-avatar";
import { useTranslations } from "@/lib/i18n/client";

interface AccountMenuProps {
  className?: string;
  avatarUrl?: string | null;
  username?: string;
}

export function AccountMenu({ className, avatarUrl, username }: AccountMenuProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [menuWidth, setMenuWidth] = useState<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      setMenuWidth(buttonRef.current?.offsetWidth ?? null);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const clearCloseTimeout = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeout.current = setTimeout(() => setOpen(false), 120);
  };

  const handleOpen = () => {
    clearCloseTimeout();
    setOpen(true);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("accountMenu.ariaLabel")}
        ref={buttonRef}
        onMouseEnter={handleOpen}
        onMouseLeave={scheduleClose}
        onFocus={handleOpen}
        onBlur={scheduleClose}
      >
        <UserAvatar
          image={avatarUrl}
          size={28}
          alt={username ? t("accountMenu.avatarAltNamed").replace("{name}", username) : t("accountMenu.avatarAlt")}
        />
        <span>{username ?? t("accountMenu.fallbackLabel")}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-30 mt-1 rounded-2xl border border-white/20 bg-slate-900/95 p-2 text-sm text-white shadow-xl"
          style={{ width: menuWidth ?? undefined }}
          onMouseEnter={handleOpen}
          onMouseLeave={scheduleClose}
        >
          <Link
            href="/profile"
            className="block rounded-xl px-4 py-3 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            {t("accountMenu.profile")}
          </Link>
          <button
            type="button"
            className="block w-full rounded-xl px-4 py-3 text-left text-white/80 transition hover:bg-white/10 hover:text-white"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            {t("accountMenu.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
