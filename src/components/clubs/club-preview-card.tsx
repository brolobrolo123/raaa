import Image from "next/image";
import Link from "next/link";
import type { ClubSummaryWithViewer } from "@/lib/club-service";
import { cn } from "@/lib/cn";

interface ClubPreviewCardProps {
  club: ClubSummaryWithViewer;
  badgeLabel: string;
}

export function ClubPreviewCard({ club, badgeLabel }: ClubPreviewCardProps) {
  const isMember = Boolean(club.viewerMembership);
  return (
    <Link
      href={`/hub/clubs/${club.slug}`}
      className="group block focus:outline-none"
      aria-label={`Entrar al club ${club.name}`}
    >
      <article
        className={cn(
          "relative flex h-full flex-col justify-between overflow-hidden rounded-4xl border border-white/15 bg-slate-950/75 p-6 text-white shadow-[0_25px_60px_rgba(2,6,23,0.65)] transition duration-500",
          "hover:-translate-y-1 hover:border-white/60 hover:bg-slate-950/90 focus-visible:-translate-y-1 focus-visible:border-white"
        )}
        style={{ backgroundImage: club.heroGradient }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl border border-white/15 bg-white/10" aria-hidden>
              <Image src={club.icon} alt="" width={56} height={56} className="h-11 w-11 object-contain" />
            </span>
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.35em] text-white/60">{badgeLabel}</span>
                {isMember && (
                  <span className="rounded-2xl border border-emerald-300/50 bg-emerald-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-100">
                    Miembro
                  </span>
                )}
              </div>
              <h3 className="mt-1 text-2xl font-semibold leading-snug">{club.name}</h3>
              <p className="text-[11px] text-white/60">{club.memberCount} miembros</p>
            </div>
          </div>
          <p className="text-sm text-white/80">{club.description}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">{club.tagline}</p>
        </div>
        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-white/70">
          <p className="line-clamp-2 max-w-[75%] text-white/70">{club.welcomeMessage}</p>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg transition group-hover:border-white group-hover:bg-white/20" aria-hidden>
            →
          </span>
        </div>
      </article>
    </Link>
  );
}
