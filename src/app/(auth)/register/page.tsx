import Link from "next/link";
import { RegisterForm } from "@/components/forms/register-form";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { HomeButton } from "@/components/navigation/home-button";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16">
      <div className="mb-6 w-full max-w-xl self-start">
        <HomeButton href="/" />
      </div>
      <Card className="w-full max-w-xl border-white/10 bg-white/10 text-white">
        <div className="space-y-8">
          <div className="space-y-3 text-center">
            <Logo asLink={false} />
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Crea tu identidad</p>
            <h1 className="text-3xl font-semibold">Únete para publicar tus teorías</h1>
          </div>
          <RegisterForm />
          <p className="text-center text-sm text-slate-300">
            ¿Ya tienes una cuenta? {" "}
            <Link href="/login" className="font-semibold text-white">
              Inicia sesión
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
