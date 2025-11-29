"use client";

import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import { RegisterForm } from "@/components/forms/register-form";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type AuthMode = "login" | "register" | null;

export function LandingAuthButtons() {
  const [mode, setMode] = useState<AuthMode>(null);

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

  return (
    <>
      <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-fuchsia-500 via-indigo-500 to-cyan-400 px-8 py-3 text-base font-semibold text-white shadow-[0_20px_45px_rgba(14,165,233,0.4)] transition duration-300 hover:-translate-y-0.5"
        >
          Iniciar sesión
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className="inline-flex items-center justify-center rounded-full border border-cyan-200/40 px-8 py-3 text-base font-semibold text-white/80 transition duration-300 hover:-translate-y-0.5 hover:border-fuchsia-200 hover:text-white"
        >
          Crear cuenta
        </button>
      </div>

      <AuthDialog mode={mode} onClose={close} onSwitch={switchMode} />
    </>
  );
}

interface AuthDialogProps {
  mode: AuthMode;
  onClose: () => void;
  onSwitch: (mode: Exclude<AuthMode, null>) => void;
}

function AuthDialog({ mode, onClose, onSwitch }: AuthDialogProps) {
  if (!mode) {
    return null;
  }

  const isLogin = mode === "login";
  const title = isLogin ? "Bienvenido de nuevo" : "Crea tu identidad";
  const subtitle = isLogin
    ? "Ingresa para retomar tu hilo analítico."
    : "Activa tu bitácora y comparte nuevas rutas temporales.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#01020b]/90 backdrop-blur" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-xl border-cyan-100/20 bg-linear-to-br from-[#060618]/95 via-[#090a24]/90 to-[#04030f]/90">
        <button
          type="button"
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:border-fuchsia-300/40 hover:bg-white/15 hover:text-white"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">{title}</p>
            <h2 className="text-3xl font-semibold">{isLogin ? "Inicia sesión" : "Regístrate"}</h2>
            <p className="text-sm text-white/70">{subtitle}</p>
          </div>
          {isLogin ? <LoginForm /> : <RegisterForm />}
          <p className="text-center text-sm text-white/70">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya estás registrado?"} {" "}
            <button
              type="button"
              className={cn("font-semibold text-cyan-300 hover:text-fuchsia-200")}
              onClick={() => onSwitch(isLogin ? "register" : "login")}
            >
              {isLogin ? "Crea una aquí" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
