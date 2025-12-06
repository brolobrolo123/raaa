import Image from "next/image";
import { redirect } from "next/navigation";
import type { SVGProps } from "react";

import { LandingAuthButtons } from "@/components/auth/landing-auth-buttons";
import { FullReloadLink } from "@/components/navigation/full-reload-link";
import { LanguageSwitch } from "@/components/navigation/language-switch";
import { auth } from "@/lib/auth";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";
import { getDefaultFabSprite } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

const TIKTOK_URL = "https://www.tiktok.com/@jsreadme";

const TikTokIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 256 303" aria-hidden="true" {...props}>
    <path
      d="M214.8 92.7c-23.2 0-42.8-18.8-43.4-42.1h-31.9v137.9c0 22-17.8 39.8-39.8 39.8s-39.8-17.8-39.8-39.8 17.8-39.8 39.8-39.8c3.3 0 6.4.4 9.4 1.2V116c-3.1-.4-6.2-.6-9.4-.6-41.8 0-75.7 33.9-75.7 75.7s33.9 75.7 75.7 75.7 75.7-33.9 75.7-75.7V108c12.8 9.1 28.3 14.5 45 14.5v-29.8z"
      fill="currentColor"
    />
  </svg>
);

export default async function Home() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/hub");
  }

  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const t = (path: string) => translate(dictionary, path);
  const defaultSprite = await getDefaultFabSprite();
  const jsReadmeHighlights = [
    {
      badge: "Publica y debate",
      title: "Expresate libremente, tu avatar te cubre",
      description:
        "Haz tendencia tu historia, debate libremente, y contruye una reputación. Unete a un Club y comienza a compartir con otras personas que aman lo mismo que tu.",
    },
    {
      badge: "Tus publicaciones te hacen subir de nivel",
      title: "Participa en el foro y ganas recompensas",
      description:
        "Publicar y recibir votaciones te dan puntos para subir de nivel tu Avatar. Asegurate de cumplir las reglas o tus publicaciones serán eliminadas y los puntos descontados",
    },
    {
      badge: "Diseña tu avatar",
      title: "Contruye a tu guerrero o... lo que quieras",
      description:
        "Al registrarte eligirás un Avatar pero no te preocupes si no lo hiciste como queria, podrás cambiarlo cuando quieras.",
    },
    {
      badge: "Batalla con otro usuarios",
      title: "Vence a todos en las batallas",
      description:
        "Las batallas son automaticas y aumentarás de poder por cada batalla ganada aunque tambien bajaras si pierdes, edita el fondo de tu Avatar cuando quieras.",
    },
  ];
  const communityRules = [
    t("home.communityRuleOne"),
    t("home.communityRuleTwo"),
    t("home.communityRuleThree"),
  ];

  return (
    <main className="relative isolate min-h-screen overflow-hidden text-emerald-100">
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-6 py-8 sm:py-12">
        <section className="relative overflow-hidden rounded-[48px] border border-white/15 bg-white/5 p-10 shadow-[0_30px_100px_rgba(2,6,17,0.65)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative -mt-3 flex flex-col gap-3 sm:-mt-4">
            <div className="flex items-center justify-between gap-1">
              <LanguageSwitch />
              <Image
                src="/logos/logo1.png"
                alt="JsReadme"
                width={320}
                height={320}
                priority
                className="h-30 w-15 object-contain sm:h-45 sm:w-65"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-6xl">
                {t("home.headline")}
              </h1>
              {t("home.subheadline") && (
                <p className="text-lg text-white/70" style={{ textShadow: "0 25px 45px rgba(3,7,18,0.7)" }}>
                  {t("home.subheadline")}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <LandingAuthButtons defaultSprite={defaultSprite} />
              <div className="w-full rounded-[32px] border border-emerald-400/20 bg-black/30 p-4 text-white shadow-[0_20px_45px_rgba(3,7,18,0.55)] sm:ml-auto sm:max-w-xs">
                <h3 className="mt-1 text-lg font-semibold">Redes Sociales</h3>
                <p className="text-sm text-white/70">
                  Actualizaciones del proyecto
                </p>
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-emerald-300/40 px-4 py-2 text-sm font-semibold tracking-[0.2em] text-white transition hover:border-white/70"
                >
                  <TikTokIcon className="h-5 w-5" />
                  Seguir
                </a>
              </div>
              <FullReloadLink
                href="#que-hacer"
                className="inline-flex items-center justify-center rounded-full border border-emerald-500/40 px-6 py-3 text-xs uppercase tracking-[0.4em] text-emerald-100 transition hover:border-emerald-400 hover:text-emerald-50 md:hidden"
              >
                {t("home.ctaQueHacer")}
              </FullReloadLink>
            </div>
          </div>
        </section>

        <section id="que-hacer" className="space-y-8">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.4em] text-emerald-200/70">¿Qué es JsReadme?</p>
            <h2 className="text-3xl font-semibold text-white">Foro Social con un juego XD</h2>
            <p className="text-base text-white/75">
              JsReadme es un foro en el que podrás expresarte libremente comentando y publicando, batallarás contra otros otros jugadores y representarás a tu Club.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {jsReadmeHighlights.map((card) => (
              <article
                key={card.title}
                className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 text-white shadow-[0_20px_60px_rgba(2,6,17,0.6)] backdrop-blur-xl"
              >
                <div className="absolute inset-0 bg-black/30 opacity-60" />
                <div className="relative space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/60">{card.badge}</p>
                  <h3 className="text-2xl font-semibold">{card.title}</h3>
                  <p className="text-sm text-white/80">{card.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-8 text-white shadow-[0_20px_60px_rgba(2,6,17,0.6)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-200/70">{t("home.communityRulesTitle")}</p>
              <h3 className="text-2xl font-semibold">{t("home.communityRulesIntro")}</h3>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-emerald-100/80">
            {communityRules.map((rule, index) => (
              <li key={`rule-${index}`} className="flex items-start gap-3">
                <span className="text-[10px] uppercase tracking-[0.35em] text-emerald-300">{index + 1}.</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
