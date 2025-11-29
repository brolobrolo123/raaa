import { randomInt } from "node:crypto";

import { LandingAuthButtons } from "@/components/auth/landing-auth-buttons";
import { getSectionCopy, SECTION_SLUGS } from "@/lib/sections";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const dysonVariants = [
  {
    text: {
      es: {
        name: "Teorías",
        mantra: "Ideas en vigilancia constante: cada hipótesis late en sincronía con nuevas pruebas.",
      },
      en: {
        name: "Theories",
        mantra: "Ideas under constant watch: every hypothesis pulses in sync with new evidence.",
      },
    },
    planetGradient: "radial-gradient(circle at 30% 30%, #fff7ed 0%, #f472b6 35%, #312e81 70%, #050611 100%)",
    shellGlow: "rgba(168, 85, 247, 0.45)",
    ringColor: "rgba(236, 72, 153, 0.4)",
    starfield: "rgba(244, 114, 182, 0.25)",
  },
  {
    text: {
      es: {
        name: "Historia",
        mantra: "Cronistas ocultos reordenan sucesos mientras revelan rutas alternas del pasado.",
      },
      en: {
        name: "History",
        mantra: "Hidden chroniclers rearrange events while revealing alternate paths from the past.",
      },
    },
    planetGradient: "radial-gradient(circle at 40% 20%, #e0f2fe 0%, #38bdf8 40%, #0f172a 75%, #020617 100%)",
    shellGlow: "rgba(14, 165, 233, 0.5)",
    ringColor: "rgba(56, 189, 248, 0.35)",
    starfield: "rgba(14, 165, 233, 0.25)",
  },
  {
    text: {
      es: {
        name: "Misterios",
        mantra: "Señales inaudibles despiertan archivos dormidos y convocan nuevas conexiones ocultas.",
      },
      en: {
        name: "Mysteries",
        mantra: "Unheard signals wake dormant files and summon new hidden connections.",
      },
    },
    planetGradient: "radial-gradient(circle at 50% 35%, #fef3c7 0%, #fbbf24 35%, #fb923c 60%, #2d0c26 90%)",
    shellGlow: "rgba(251, 146, 60, 0.55)",
    ringColor: "rgba(251, 191, 36, 0.35)",
    starfield: "rgba(251, 191, 36, 0.22)",
  },
  {
    text: {
      es: {
        name: "Crónicas",
        mantra: "Relatos cifrados viajan entre investigadores para completar verdades fragmentadas.",
      },
      en: {
        name: "Chronicles",
        mantra: "Encrypted stories travel between researchers to complete fragmented truths.",
      },
    },
    planetGradient: "radial-gradient(circle at 20% 25%, #efe9ff 0%, #a78bfa 35%, #312e81 65%, #030014 100%)",
    shellGlow: "rgba(99, 102, 241, 0.5)",
    ringColor: "rgba(129, 140, 248, 0.4)",
    starfield: "rgba(76, 29, 149, 0.3)",
  },
];

export default async function Home() {
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const t = (path: string) => translate(dictionary, path);
  const variant = dysonVariants[randomInt(dysonVariants.length)];
  const variantCopy = variant.text[locale];
  const sectionHighlights = SECTION_SLUGS.map((slug) => getSectionCopy(slug, locale));

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#02030f] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(236,72,153,0.25),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.25),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(14,116,144,0.25),transparent_40%)]" />
        <div className="cosmic-noise" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16 sm:py-24">
        <div className="grid items-center gap-12 rounded-[48px] border border-white/10 bg-[#05051a]/70 p-10 shadow-[0_60px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-10">
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                {t("home.headline")}
              </h1>
            </div>

            <ul className="space-y-4 text-sm text-white/70">
              {sectionHighlights.map((section) => (
                <li key={section.name ?? section.description} className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                  <span className="text-xs uppercase tracking-[0.4em] text-cyan-200/90">{section.name}</span>
                  <span className="text-base leading-relaxed text-white/85">{section.description}</span>
                  {section.example ? (
                    <span className="text-sm italic text-white/60">“{section.example}”</span>
                  ) : null}
                </li>
              ))}
            </ul>

            <LandingAuthButtons />
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 blur-3xl" style={{ background: variant.starfield }} aria-hidden />
            <DysonSphere variant={variant} />
            <div className="mt-8 space-y-2 text-center text-sm text-white/70">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">{variantCopy.name}</p>
              <p className="text-base text-white/85">{variantCopy.mantra}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

type DysonVariant = (typeof dysonVariants)[number];

function DysonSphere({ variant }: { variant: DysonVariant }) {
  const sparks = [
    { size: "w-2 h-2", delay: "0s", orbit: "40%" },
    { size: "w-1.5 h-1.5", delay: "-2s", orbit: "55%" },
    { size: "w-2 h-2", delay: "-4s", orbit: "70%" },
    { size: "w-1.5 h-1.5", delay: "-6s", orbit: "82%" },
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      <div className="absolute inset-0 rounded-full opacity-60" style={{ boxShadow: `0 0 140px ${variant.shellGlow}` }} aria-hidden />
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="dyson-shell" style={{ boxShadow: `0 0 60px ${variant.shellGlow}` }}>
          <div className="dyson-ring" style={{ borderColor: variant.ringColor }} />
          <div className="dyson-ring dyson-ring--offset" style={{ borderColor: variant.ringColor }} />
          <div className="dyson-core" style={{ background: variant.planetGradient }} />
          <div className="dyson-heart" />
          {sparks.map((spark, index) => (
            <span
              key={index}
              className={`orbiting-node ${spark.size}`}
              style={{ animationDelay: spark.delay, inset: spark.orbit }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
