import { BattleStatus, type Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";
import type { MiniProfileDTO, OwnedBadgeDTO } from "@/types/profile";
import { resolveMiniProfileAccent } from "./mini-profile";
import { PROFILE_ARTICLE_POINTS, PROFILE_VOTE_POINTS } from "./avatar/power";

interface UserContributionStats {
  articleCount: number;
  commentCount: number;
  articleVoteCount: number;
  points: number;
  totalArticleScore: number;
  topArticle: {
    id: string;
    title: string;
    score: number;
    createdAt: Date;
  } | null;
  latestComment: {
    id: string;
    body: string;
    createdAt: Date;
    articleId: string;
    articleTitle: string;
  } | null;
}

type BadgeBlueprint = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  requirement: (stats: UserContributionStats) => boolean;
};

const BADGE_BLUEPRINTS: BadgeBlueprint[] = [
  {
    slug: "primer-articulo",
    name: "Primera teoría",
    description: "Publicaste tu primer artículo.",
    icon: "🌱",
    requirement: (stats) => stats.articleCount >= 1,
  },
  {
    slug: "voz-constante",
    name: "Voz constante",
    description: "Publicaste cinco artículos.",
    icon: "📚",
    requirement: (stats) => stats.articleCount >= 5,
  },
  {
    slug: "primer-comentario",
    name: "Primera réplica",
    description: "Participaste en un hilo por primera vez.",
    icon: "💬",
    requirement: (stats) => stats.commentCount >= 1,
  },
  {
    slug: "moderador-debate",
    name: "Moderador del debate",
    description: "Alcanzaste 25 comentarios.",
    icon: "🗣️",
    requirement: (stats) => stats.commentCount >= 25,
  },
  {
    slug: "favorito-comunidad",
    name: "Favorito de la comunidad",
    description: "Un artículo tuyo superó los 25 votos.",
    icon: "🏅",
    requirement: (stats) => (stats.topArticle?.score ?? 0) >= 25,
  },
  {
    slug: "impacto-colectivo",
    name: "Impacto colectivo",
    description: "Sumaste 100 votos acumulados en tus artículos.",
    icon: "🚀",
    requirement: (stats) => stats.totalArticleScore >= 100,
  },
];

async function ensureBadgeCatalog(client: PrismaClient) {
  const records = await Promise.all(
    BADGE_BLUEPRINTS.map((badge) =>
      client.badge.upsert({
        where: { slug: badge.slug },
        update: {
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
        },
        create: {
          slug: badge.slug,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
        },
      }),
    ),
  );
  return new Map(records.map((record) => [record.slug, record]));
}

async function computeUserStats(userId: string, client: PrismaClient): Promise<UserContributionStats> {
  const [articleCount, commentCount, articleVoteCount, articleScoreAggregate, topArticle, latestComment] =
    await client.$transaction([
      client.article.count({ where: { authorId: userId } }),
      client.comment.count({ where: { authorId: userId } }),
      client.articleVote.count({ where: { article: { authorId: userId } } }),
      client.article.aggregate({ where: { authorId: userId }, _sum: { score: true } }),
      client.article.findFirst({
        where: { authorId: userId },
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
        select: { id: true, title: true, score: true, createdAt: true },
      }),
      client.comment.findFirst({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          article: { select: { id: true, title: true } },
        },
      }),
    ]);

  const points = articleCount * PROFILE_ARTICLE_POINTS + articleVoteCount * PROFILE_VOTE_POINTS;
  return {
    articleCount,
    commentCount,
    articleVoteCount,
    points,
    totalArticleScore: articleScoreAggregate._sum.score ?? 0,
    topArticle: topArticle ?? null,
    latestComment: latestComment
      ? {
          id: latestComment.id,
          body: latestComment.body,
          createdAt: latestComment.createdAt,
          articleId: latestComment.article.id,
          articleTitle: latestComment.article.title,
        }
      : null,
  };
}

async function refreshUserBadges(userId: string, client: PrismaClient) {
  const catalog = await ensureBadgeCatalog(client);
  const stats = await computeUserStats(userId, client);

  await Promise.all(
    BADGE_BLUEPRINTS.map(async (blueprint) => {
      const badge = catalog.get(blueprint.slug);
      if (!badge) return;
      if (!blueprint.requirement(stats)) return;
      await client.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId,
            badgeId: badge.id,
          },
        },
        update: {},
        create: {
          userId,
          badgeId: badge.id,
        },
      });
    }),
  );

  return stats;
}

function mapUserBadgeToDTO(badge: Prisma.UserBadgeGetPayload<{ include: { badge: true } }>): OwnedBadgeDTO {
  return {
    id: badge.id,
    badgeId: badge.badgeId,
    slug: badge.badge.slug,
    name: badge.badge.name,
    description: badge.badge.description,
    icon: badge.badge.icon ?? null,
    earnedAt: badge.earnedAt.toISOString(),
    featuredSlot: badge.featuredSlot ?? null,
  };
}

function orderBadgesForDisplay(badges: OwnedBadgeDTO[]) {
  return badges
    .filter((badge) => badge.featuredSlot !== null)
    .sort((a, b) => (a.featuredSlot ?? 0) - (b.featuredSlot ?? 0));
}

export async function getUserBadgeOverview(userId: string, client: PrismaClient = prisma) {
  await refreshUserBadges(userId, client);
  const userBadges = await client.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: [{ featuredSlot: "asc" }, { earnedAt: "desc" }],
  });
  return userBadges.map(mapUserBadgeToDTO);
}

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

function hasTransactionMethod(client: PrismaClientOrTx): client is PrismaClient {
  return typeof (client as PrismaClient).$transaction === "function";
}

async function updateFeaturedBadgesInTx(
  tx: Prisma.TransactionClient,
  userId: string,
  normalized: string[],
) {
  await tx.userBadge.updateMany({ where: { userId }, data: { featuredSlot: null } });
  await Promise.all(
    normalized.map((id, index) =>
      tx.userBadge.updateMany({
        where: { id, userId },
        data: { featuredSlot: index + 1 },
      }),
    ),
  );
  return tx.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: [{ featuredSlot: "asc" }, { earnedAt: "desc" }],
  });
}

export async function setFeaturedBadges(
  userId: string,
  userBadgeIds: string[],
  client: PrismaClientOrTx = prisma,
): Promise<OwnedBadgeDTO[]> {
  const normalized = Array.from(new Set(userBadgeIds)).slice(0, 4);
  const updated = hasTransactionMethod(client)
    ? await client.$transaction((tx) => updateFeaturedBadgesInTx(tx, userId, normalized))
    : await updateFeaturedBadgesInTx(client, userId, normalized);
  return updated.map(mapUserBadgeToDTO);
}

export async function getUserContributionStats(userId: string, client: PrismaClient = prisma) {
  return computeUserStats(userId, client);
}

async function getUserBattleStats(userId: string, client: PrismaClient) {
  const avatar = await client.avatar.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!avatar) {
    return null;
  }
  const [total, wins, losses] = await client.$transaction([
    client.avatarBattle.count({
      where: {
        status: BattleStatus.COMPLETE,
        OR: [{ challengerId: avatar.id }, { opponentId: avatar.id }],
      },
    }),
    client.avatarBattle.count({
      where: {
        status: BattleStatus.COMPLETE,
        winnerId: avatar.id,
      },
    }),
    client.avatarBattle.count({
      where: {
        status: BattleStatus.COMPLETE,
        loserId: avatar.id,
      },
    }),
  ]);

  return { total, wins, losses };
}

export async function getMiniProfilePayload(
  username: string,
  client: PrismaClient = prisma,
): Promise<MiniProfileDTO | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const user = await client.user.findUnique({
    where: { username: normalized },
    select: {
      id: true,
      username: true,
      image: true,
      bio: true,
      createdAt: true,
      lastSeenAt: true,
      miniProfileAccent: true,
    },
  });

  if (!user) {
    return null;
  }

  const stats = await refreshUserBadges(user.id, client);
  const [userBadges, battleStats] = await Promise.all([
    client.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
    }),
    getUserBattleStats(user.id, client),
  ]);
  const orderedBadges = orderBadgesForDisplay(userBadges.map(mapUserBadgeToDTO));

  return {
    username: user.username,
    avatar: user.image,
    bio: user.bio,
    accentColor: resolveMiniProfileAccent(user.miniProfileAccent),
    joinedAt: user.createdAt.toISOString(),
    lastSeenAt: user.lastSeenAt.toISOString(),
    stats: {
      articles: stats.articleCount,
      comments: stats.commentCount,
      votes: stats.articleVoteCount,
      points: stats.points,
    },
    battleStats: battleStats
      ? {
          total: battleStats.total,
          wins: battleStats.wins,
          losses: battleStats.losses,
        }
      : null,
    topArticle: stats.topArticle
      ? {
          id: stats.topArticle.id,
          title: stats.topArticle.title,
          score: stats.topArticle.score,
          createdAt: stats.topArticle.createdAt.toISOString(),
        }
      : null,
    latestComment: stats.latestComment
      ? {
          id: stats.latestComment.id,
          body: stats.latestComment.body,
          createdAt: stats.latestComment.createdAt.toISOString(),
          articleId: stats.latestComment.articleId,
          articleTitle: stats.latestComment.articleTitle,
        }
      : null,
    badges: orderedBadges.map((badge) => ({
      userBadgeId: badge.id,
      badgeId: badge.badgeId,
      slug: badge.slug,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      featuredSlot: badge.featuredSlot,
    })),
  };
}
