import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { type Role } from "@/types/roles";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { PanelUserControls } from "@/components/panel/panel-user-controls";
import { PanelUserSearch } from "@/components/panel/panel-user-search";
import { ReviewQueueControls } from "@/components/panel/review-queue-controls";
import { ModerationRequestControls } from "@/components/panel/moderation-request-controls";
import { RoleAssignmentSearch } from "@/components/panel/role-assignment-search";
import { ReviewLinkForm } from "@/components/panel/review-link-form";
import { RoleManager } from "@/components/panel/role-manager";
import { BaseSpriteEditor } from "@/components/panel/base-sprite-editor";
import { getDefaultFabSpriteSerialized } from "@/lib/site-settings";
import { ClubModeratorRequestCard } from "@/components/panel/club-moderator-request-card";

const ADMIN_ROLES: Role[] = ["MODERATOR", "ADMIN", "OWNER"];

export default async function ModerationPanelPage() {
  const session = await requireUser();
  const role = session.user.role;
  if (!role || !ADMIN_ROLES.includes(role)) {
    notFound();
  }

  const now = new Date();
  const isAdminRole = role === "ADMIN" || role === "OWNER";
  const isOwner = role === "OWNER";
  const defaultFabSprite = isOwner ? await getDefaultFabSpriteSerialized() : null;

  const [bannedUsers, reviewArticles, moderationRequests, clubModeratorRequests, roleEntries] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { bannedUntil: { gt: now } },
          { silencedUntil: { gt: now } },
        ],
      },
      orderBy: { username: "asc" },
      select: { id: true, username: true, bannedUntil: true, silencedUntil: true, permanentBan: true },
    }),
    prisma.article.findMany({
      where: { status: "REVIEW" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, author: { select: { username: true } } },
    }),
    isAdminRole
      ? prisma.moderatorRequest.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          include: { user: true },
        })
      : Promise.resolve([]),
    isAdminRole
      ? prisma.clubModeratorRequest.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { username: true } },
            club: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    isOwner
      ? prisma.user.findMany({
          orderBy: { username: "asc" },
          select: { id: true, username: true, role: true },
        })
      : Promise.resolve([]),
  ]);

  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const t = (path: string) => translate(dictionary, path);

  const roleSearchProps = {
    label: t("common.moderationPanelRoleSearchLabel"),
    placeholder: t("common.moderationPanelSearchPlaceholder"),
    searchButtonLabel: t("common.moderationPanelSearchButton"),
    resultsLabel: t("common.moderationPanelSearchResultsLabel"),
    assignButtonLabel: t("common.moderationPanelRoleSearchAssignButton"),
    ownerHint: t("common.moderationPanelRoleSearchOwnerHint"),
    queryRequiredMessage: t("common.moderationPanelSearchQueryRequired"),
    noResultsMessage: t("common.moderationPanelSearchNoResults"),
    assignSuccessMessage: t("common.moderationPanelRoleSearchSuccess"),
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16 text-white">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-300">{role}</p>
        <h1 className="text-4xl font-semibold">{t("common.moderationPanelLabel")}</h1>
        <p className="text-slate-300">{t("common.moderationPanelDescription")}</p>
      </header>

      <section className="space-y-6">
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/80">
          <p>{t("common.moderationPanelModeratorDescription")}</p>
          {isAdminRole && <p>{t("common.moderationPanelAdminDescription")}</p>}
          {isOwner && <p>{t("common.moderationPanelOwnerDescription")}</p>}
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-white/60">
          <span>{t("common.moderationPanelBannedUsersLabel")}</span>
        </header>
        <PanelUserSearch canEditAvatarStats={isOwner} />
        {bannedUsers.length === 0 ? (
          <Card className="border border-white/10 bg-slate-950/70 p-6 text-sm text-white/70">
            <p>No hay usuarios actualmente penalizados.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {bannedUsers.map((user) => (
              <Card key={user.id} className="border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-6 text-sm text-white/60">
                  <div>
                    <p className="text-base font-semibold text-white">{user.username}</p>
                    {user.permanentBan && (
                      <p className="text-[11px] text-rose-300">{t("common.moderationPanelActivePermanentBan")}</p>
                    )}
                    <p>
                      {user.bannedUntil && <span>Baneado hasta {user.bannedUntil.toLocaleString()}</span>}
                      {user.silencedUntil && user.bannedUntil && <span> · </span>}
                      {user.silencedUntil && <span>Silenciado hasta {user.silencedUntil.toLocaleString()}</span>}
                    </p>
                  </div>
                  <PanelUserControls
                    userId={user.id}
                    bannedUntil={user.bannedUntil?.toISOString() ?? null}
                    silencedUntil={user.silencedUntil?.toISOString() ?? null}
                    permanentBan={user.permanentBan}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-white/60">
          <span>{t("common.moderationPanelReviewLabel")}</span>
        </header>
        <ReviewLinkForm />
        {reviewArticles.length === 0 ? (
          <Card className="border border-white/10 bg-slate-950/70 p-6 text-sm text-white/70">
            <p>No hay publicaciones en revisión.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviewArticles.map((article) => (
              <Card key={article.id} className="space-y-3 border border-white/10 bg-white/5 p-5">
                <div>
                  <p className="text-base font-semibold text-white">{article.title}</p>
                  <p className="text-xs text-white/60">Autor: @{article.author.username}</p>
                </div>
                <ReviewQueueControls articleId={article.id} />
              </Card>
            ))}
          </div>
        )}
      </section>

      {isAdminRole && (
        <section className="space-y-4">
          <header className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-white/60">
            <span>{t("common.moderationPanelRequestsLabel")}</span>
          </header>
          {moderationRequests.length === 0 ? (
            <Card className="border border-white/10 bg-slate-950/70 p-6 text-sm text-white/70">
              <p>No hay solicitudes nuevas.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {moderationRequests.map((request) => (
                <Card key={request.id} className="space-y-3 border border-white/10 bg-white/5 p-5">
                  <div>
                    <p className="text-base font-semibold text-white">@{request.user.username}</p>
                    <p className="text-xs text-white/60">Solicitud pendiente desde {request.createdAt.toLocaleDateString()}</p>
                  </div>
                  <ModerationRequestControls requestId={request.id} />
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {isAdminRole && (
        <section className="space-y-4">
          <header className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-white/60">
            <span>Solicitudes de moderador de clubs</span>
          </header>
          {clubModeratorRequests.length === 0 ? (
            <Card className="border border-white/10 bg-slate-950/70 p-6 text-sm text-white/70">
              <p>No hay solicitudes de clubs pendientes.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {clubModeratorRequests.map((request) => (
                <ClubModeratorRequestCard
                  key={request.id}
                  requestId={request.id}
                  username={request.user.username}
                  clubName={request.club.name}
                  discord={request.discord}
                  motivation={request.motivation}
                  createdAt={request.createdAt.toISOString()}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {isOwner && (
        <>
          <section className="space-y-3">
            <header className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-white/60">
              <span>{t("common.moderationPanelRoleManagerLabel")}</span>
            </header>
            <p className="text-sm text-white/70">{t("common.moderationPanelRoleManagerDescription")}</p>
            <RoleAssignmentSearch {...roleSearchProps} />
            <RoleManager entries={roleEntries} currentOwnerId={session.user.id} />
          </section>

          <section className="space-y-3">
            <header className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-white/60">
              <span>Avatar base</span>
              <span className="text-xs text-white/50">Solo Dueño</span>
            </header>
            <p className="text-sm text-white/70">
              Define la silueta inicial que recibirán los próximos usuarios registrados.
            </p>
            {defaultFabSprite && <BaseSpriteEditor initialSprite={defaultFabSprite} />}
          </section>
        </>
      )}
    </main>
  );
}
