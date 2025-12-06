"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import { getAvatarUrl } from "@/lib/media";

interface AvatarUploaderProps {
  initialAvatar?: string | null;
  username: string;
}

export function AvatarUploader({ initialAvatar, username }: AvatarUploaderProps) {
  const router = useRouter();
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(getAvatarUrl(initialAvatar));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setError(null);
    setStatus(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? t("profilePage.avatarUploader.error"));
        return;
      }
      const data = (await response.json()) as { url: string };
      setPreview(getAvatarUrl(data.url));
      setStatus(t("profilePage.avatarUploader.success"));
      if (typeof window !== "undefined") {
        window.location.reload();
      } else {
        router.refresh();
      }
    } catch (uploadError) {
      console.error(uploadError);
      setError(t("profilePage.avatarUploader.unexpectedError"));
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-white">
      <div className="flex items-center gap-4">
        <Image
          src={preview}
          alt={t("accountMenu.avatarAltNamed").replace("{name}", username)}
          width={96}
          height={96}
          unoptimized
          className="h-24 w-24 rounded-full border-2 border-white/20 object-cover"
        />
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("profilePage.avatarUploader.title")}</p>
          <p className="text-sm text-slate-200">{t("profilePage.avatarUploader.hint")}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handlePick} loading={isUploading}>
              {t("profilePage.avatarUploader.button")}
            </Button>
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400">{t("profilePage.avatarUploader.maxSize")}</span>
          </div>
        </div>
      </div>
      {status && <p className="text-sm text-emerald-200">{status}</p>}
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
