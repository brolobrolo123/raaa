"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n/client";

export function PasswordForm() {
  const t = useTranslations();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage(t("profilePage.passwordForm.mismatch"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setIsError(true);
        setMessage(typeof data?.error === "string" ? data.error : t("profilePage.passwordForm.error"));
        return;
      }

      setMessage(data?.message ?? t("profilePage.passwordForm.success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setIsError(true);
      setMessage(t("profilePage.passwordForm.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("profilePage.passwordForm.currentLabel")}</label>
        <Input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("profilePage.passwordForm.newLabel")}</label>
        <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("profilePage.passwordForm.confirmLabel")}</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>
      {message && (
        <p className={`text-sm ${isError ? "text-rose-300" : "text-emerald-300"}`}>
          {message}
        </p>
      )}
      <Button type="submit" loading={isSubmitting} className="w-full">
        {t("profilePage.passwordForm.submit")}
      </Button>
    </form>
  );
}
