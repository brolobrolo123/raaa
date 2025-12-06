"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { registerSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n/client";
import {
  DEFAULT_PIXEL_SPRITE,
  cloneSprite,
  serializeFabSpriteCollection,
  type PixelSprite,
  MAX_SPRITE_SLOTS,
  MIN_SPRITE_SLOTS,
} from "@/lib/pixel-avatar";
import { FormMessage } from "./form-message";
import { RegisterAvatarModal } from "./register-avatar-modal";

interface RegisterFormProps {
  defaultSprite?: PixelSprite;
}

const displaySchema = registerSchema.extend({ confirmPassword: registerSchema.shape.password });
type RegisterValues = z.infer<typeof displaySchema>;

export function RegisterForm({ defaultSprite }: RegisterFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [pendingValues, setPendingValues] = useState<RegisterValues | null>(null);
  const [avatarSprite, setAvatarSprite] = useState<PixelSprite>(() =>
    cloneSprite(defaultSprite ?? DEFAULT_PIXEL_SPRITE),
  );
  const [modalError, setModalError] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<RegisterValues>({
    resolver: zodResolver(displaySchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  const passwordValue = useWatch({ control, name: "password" });
  const confirmPasswordValue = useWatch({ control, name: "confirmPassword" });

  const buildSpritePayload = (sprite: PixelSprite) =>
    serializeFabSpriteCollection({
      activeSlot: 0,
      designs: Array.from({ length: MAX_SPRITE_SLOTS }, () => cloneSprite(sprite)),
      unlockedSlots: MIN_SPRITE_SLOTS,
    });

  const handleAvatarStep = handleSubmit((values) => {
    if (values.password !== values.confirmPassword) {
      setIsError(true);
      setMessage(t("auth.registerForm.mismatchError"));
      return;
    }

    setMessage(null);
    setIsError(false);
    setPendingValues(values);
    setModalError(null);
    setShowAvatarModal(true);
  });

  const finalizeRegistration = async (sprite: PixelSprite) => {
    if (!pendingValues) {
      return;
    }
    setAvatarSprite(cloneSprite(sprite));
    setModalError(null);
    setIsFinalizing(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: pendingValues.username.toLowerCase(),
          email: pendingValues.email.toLowerCase(),
          password: pendingValues.password,
          fabSprite: buildSpritePayload(sprite),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const errorMessage = data?.error ?? t("auth.registerForm.genericError");
        setModalError(errorMessage);
        setIsError(true);
        setMessage(errorMessage);
        return;
      }

      await signIn("credentials", {
        redirect: false,
        credential: pendingValues.email.toLowerCase(),
        password: pendingValues.password,
      });

      setMessage(t("auth.registerForm.success"));
      setIsError(false);
      setShowAvatarModal(false);
      setPendingValues(null);
      router.push("/hub");
    } catch (error) {
      console.error("Failed to finalize registration", error);
      setModalError(t("auth.registerForm.genericError"));
      setIsError(true);
      setMessage(t("auth.registerForm.genericError"));
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <>
      <form onSubmit={handleAvatarStep} className="space-y-5">
      <div className="grid gap-3">
        <label className="text-sm text-slate-200">{t("auth.registerForm.usernameLabel")}</label>
        <Input placeholder={t("auth.registerForm.usernamePlaceholder")} autoComplete="username" {...register("username")} />
        {errors.username && <p className="text-xs text-rose-200">{errors.username.message}</p>}
      </div>
      <div className="grid gap-3">
        <label className="text-sm text-slate-200">{t("auth.registerForm.emailLabel")}</label>
        <Input type="email" placeholder={t("auth.registerForm.emailPlaceholder")} autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-rose-200">{errors.email.message}</p>}
      </div>
      <div className="grid gap-3">
        <label className="text-sm text-slate-200">{t("auth.registerForm.passwordLabel")}</label>
        <Input type="password" placeholder={t("auth.registerForm.passwordPlaceholder")} autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-xs text-rose-200">{errors.password.message}</p>}
      </div>
      <div className="grid gap-3">
        <label className="text-sm text-slate-200">{t("auth.registerForm.confirmPasswordLabel")}</label>
        <Input type="password" placeholder={t("auth.registerForm.confirmPasswordPlaceholder")} autoComplete="new-password" {...register("confirmPassword")} />
        {passwordValue !== confirmPasswordValue && Boolean(confirmPasswordValue) && (
          <p className="text-xs text-rose-200">{t("auth.registerForm.mismatchError")}</p>
        )}
      </div>
      <FormMessage type={isError ? "error" : "success"} message={message} />
        <Button type="submit" loading={isSubmitting || isFinalizing} disabled={isFinalizing} className="w-full">
          {t("auth.registerForm.startAvatarStep")}
        </Button>
      </form>

      <RegisterAvatarModal
        open={showAvatarModal}
        initialSprite={avatarSprite}
        loading={isFinalizing}
        error={modalError}
        onCancel={() => {
          setShowAvatarModal(false);
          setModalError(null);
        }}
        onConfirm={finalizeRegistration}
      />
    </>
  );
}
