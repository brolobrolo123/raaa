import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { HomeButton } from "@/components/navigation/home-button";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16">
      <div className="mb-6 w-full max-w-xl self-start">
        <HomeButton href="/" />
      </div>
      <Card className="w-full max-w-xl border-white/10 bg-white/10 text-white">
        <div className="space-y-8">
          <div className="space-y-3 text-center">
            <Logo asLink={false} />
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Bienvenido de nuevo</p>
            <h1 className="text-3xl font-semibold">Ingresa para elegir tu línea temporal</h1>
          </div>
          <LoginForm />
          <p className="text-center text-sm text-slate-300">
            ¿No tienes cuenta? {" "}
            <Link href="/register" className="font-semibold text-white">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
