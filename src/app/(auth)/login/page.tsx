import Link from "next/link";
import type { SVGProps } from "react";

import { LoginForm } from "@/components/forms/login-form";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { HomeButton } from "@/components/navigation/home-button";

type SearchParams = {
  banned?: string;
  permanent?: string;
  until?: string;
  reason?: string;
};

type ServerMessage = {
  text: string;
  type: "error" | "success";
};

const TIKTOK_URL = "https://www.tiktok.com/@jsreadme";

const TikTokIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 256 303" aria-hidden="true" {...props}>
    <path
      d="M214.8 92.7c-23.2 0-42.8-18.8-43.4-42.1h-31.9v137.9c0 22-17.8 39.8-39.8 39.8s-39.8-17.8-39.8-39.8 17.8-39.8 39.8-39.8c3.3 0 6.4.4 9.4 1.2V116c-3.1-.4-6.2-.6-9.4-.6-41.8 0-75.7 33.9-75.7 75.7s33.9 75.7 75.7 75.7 75.7-33.9 75.7-75.7V108c12.8 9.1 28.3 14.5 45 14.5v-29.8z"
      fill="currentColor"
    />
  </svg>
);

function buildBanMessage(searchParams?: SearchParams): ServerMessage | undefined {
  const banned = searchParams?.banned === "1" || searchParams?.banned === "true";
  if (!banned) return undefined;
  const isPermanent = searchParams?.permanent === "1" || searchParams?.permanent === "true";
  const until = searchParams?.until ? new Date(searchParams.until) : null;
  const reason = searchParams?.reason;
  const message = isPermanent
    ? "Tu cuenta fue baneada permanentemente."
    : until
      ? `Tu cuenta está baneada hasta ${until.toLocaleString()}.`
      : "Tu cuenta está temporalmente suspendida.";
  const fullMessage = reason ? `${message} Motivo: ${reason}` : message;
  return { text: fullMessage, type: "error" };
}

export default async function LoginPage({
  searchParams,
 }: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const serverMessage = buildBanMessage(resolvedSearchParams);
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
            <div className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-3xl border border-emerald-400/20 bg-black/40 p-4 text-left text-sm shadow-[0_20px_50px_rgba(2,6,17,0.65)]">
              <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-100/70">Clips diarios</p>
              <p className="text-base font-semibold text-white">Batallas, teorías y builds en TikTok</p>
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-4 py-2 font-semibold tracking-[0.25em] text-white transition hover:border-white/60"
              >
                <TikTokIcon className="h-5 w-5" />
                Seguir
              </a>
            </div>
          </div>
          <LoginForm serverMessage={serverMessage} />
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
