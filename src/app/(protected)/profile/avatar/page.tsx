import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getUserContributionStats } from "@/lib/badge-service";
import { FullReloadLink } from "@/components/navigation/full-reload-link";
import { FabSpriteDesigner } from "@/components/profile/fab-sprite-designer";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";
import { isOwnerRole } from "@/lib/moderation";
import { getDefaultFabSpriteSerialized } from "@/lib/site-settings";

export default async function ProfileAvatarPage() {
  const session = await requireUser();
  const isOwner = isOwnerRole(session.user.role);
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      fabPixelSprite: true,
    },
  });

  if (!profile) {
    notFound();
  }

  const contributionStats = await getUserContributionStats(session.user.id);
  const initialSprite = profile.fabPixelSprite ?? (await getDefaultFabSpriteSerialized());

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16 text-white">
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{translate(dictionary, "common.profile")}</p>
        <h1 className="text-4xl font-semibold">
          {translate(
            dictionary,
            isOwner ? "profilePage.avatarTabTitle" : "profilePage.avatarLockedTitle",
          )}
        </h1>
        <p className="text-sm text-slate-300">
          {translate(
            dictionary,
            isOwner ? "profilePage.avatarTabSubtitle" : "profilePage.avatarLockedDescription",
          )}
        </p>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
          {translate(
            dictionary,
            isOwner ? "profilePage.avatarTabHint" : "profilePage.avatarLockedHint",
          )}
        </p>
        <FullReloadLink
          href="/profile"
          className="text-sm font-semibold text-sky-300 hover:text-sky-200"
        >
          {translate(dictionary, "profilePage.backToProfileButton")}
        </FullReloadLink>
      </div>

      {isOwner ? (
        <FabSpriteDesigner initialSprite={initialSprite} availablePoints={contributionStats.points} />
      ) : (
        <div className="mt-10 rounded-3xl border border-white/10 bg-slate-950/60 p-8 text-center">
          <p className="text-base text-slate-200">
            {translate(dictionary, "profilePage.avatarLockedDescription")}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {translate(dictionary, "profilePage.avatarLockedHint")}
          </p>
          <div className="mt-6">
            <FullReloadLink
              href="/profile"
              className="text-sm font-semibold text-sky-300 hover:text-sky-200"
            >
              {translate(dictionary, "profilePage.backToProfileButton")}
            </FullReloadLink>
          </div>
        </div>
      )}
    </main>
  );
}
