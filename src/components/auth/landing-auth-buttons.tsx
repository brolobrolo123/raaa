"use client";

import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import { RegisterForm } from "@/components/forms/register-form";
import { cn } from "@/lib/cn";
import { createPortal } from "react-dom";
import { useTranslations } from "@/lib/i18n/client";
import type { PixelSprite } from "@/lib/pixel-avatar";

type AuthMode = "login" | "register" | null;

interface LandingAuthButtonsProps {
  defaultSprite?: PixelSprite;
}

export function LandingAuthButtons({ defaultSprite }: LandingAuthButtonsProps) {
  const t = useTranslations();
  const [mode, setMode] = useState<AuthMode>(null);
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);

  const close = () => setMode(null);
  const switchMode = (next: Exclude<AuthMode, null>) => setMode(next);

  useEffect(() => {
    if (!mode) {
      return undefined;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mode]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }
    const el = document.createElement("div");
    el.setAttribute("data-landing-auth-portal", "true");
    document.body.appendChild(el);
    setPortalElement(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-sm font-semibold sm:flex-row sm:items-center sm:text-base">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="inline-flex w-auto items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#4a2b0c] via-[#7c5624] to-[#c18a40] px-5 py-3 text-sm text-[#fdf9f0] shadow-[0_20px_60px_rgba(15,8,3,0.55)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_25px_80px_rgba(15,8,3,0.75)] sm:px-6 sm:py-4.4 sm:text-base"
        >
          {t("auth.landing.loginButton")}
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className="inline-flex w-auto items-center justify-center rounded-full border border-[#3b200b] bg-gradient-to-br from-[#2d1908] via-[#513010] to-[#7b4d1d] px-5 py-3 text-sm text-[#fef7ed] transition duration-300 hover:-translate-y-0.5 hover:border-[#5c2f0c] hover:text-white sm:px-6 sm:py-4.4 sm:text-base"
        >
          {t("auth.landing.registerButton")}
        </button>
      </div>

      <AuthDialog
        mode={mode}
        onClose={close}
        onSwitch={switchMode}
        portalElement={portalElement}
        defaultSprite={defaultSprite}
      />
    </>
  );
}

interface AuthDialogProps {
  mode: AuthMode;
  onClose: () => void;
  onSwitch: (mode: Exclude<AuthMode, null>) => void;
  portalElement: HTMLDivElement | null;
  defaultSprite?: PixelSprite;
}

function AuthDialog({ mode, onClose, onSwitch, portalElement, defaultSprite }: AuthDialogProps) {
  const t = useTranslations();
  if (!mode) {
    return null;
  }

  const isLogin = mode === "login";
  const title = isLogin ? t("auth.landing.loginTitle") : t("auth.landing.registerTitle");
  const subtitle = isLogin
    ? t("auth.landing.loginSubtitle")
    : t("auth.landing.registerSubtitle");

  if (!portalElement) {
    return null;
  }

  return (
    createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
        <div
          className="absolute inset-0 bg-[#020207]/90 backdrop-blur-[40px]"
          onClick={onClose}
        />
        <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[44px] border border-[#4b2d16] bg-gradient-to-br from-[#150903]/95 via-[#3b1c0f]/90 to-[#070302]/95 p-10 shadow-[0_35px_120px_rgba(0,0,0,0.95)]">
          <button
            type="button"
            className="absolute right-6 top-6 rounded-full border border-[#cda674]/40 bg-[#1b0c05]/70 p-2 text-white/70 transition hover:border-[#f6d49d] hover:bg-[#3f1f0b] hover:text-white"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">{title}</p>

              <p className="text-sm text-white/70">{subtitle}</p>
            </div>
            {isLogin ? <LoginForm /> : <RegisterForm defaultSprite={defaultSprite} />}
            <p className="text-center text-sm text-white/70">
              {isLogin ? t("auth.landing.noAccountPrompt") : t("auth.landing.alreadyRegistered")} {" "}
              <button
                type="button"
                className={cn("font-semibold text-cyan-300 hover:text-fuchsia-200")}
                onClick={() => onSwitch(isLogin ? "register" : "login")}
              >
                {isLogin ? t("auth.landing.createHere") : t("auth.landing.loginHere")}
              </button>
            </p>
          </div>
        </div>
      </div>,
      portalElement,
    )
  );
}
