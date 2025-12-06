"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";

export function ProfileSignOutButton() {
  const t = useTranslations();
  const postSignOutUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jsread.me/";

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = postSignOutUrl;
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="mt-6 w-full border-white/30 text-white hover:bg-white/10"
      onClick={handleSignOut}
    >
      {t("accountMenu.signOut")}
    </Button>
  );
}