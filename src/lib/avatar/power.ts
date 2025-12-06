import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const PROFILE_ARTICLE_POINTS = 3;
export const PROFILE_VOTE_POINTS = 1;

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

export async function getProfilePointComponents(
  userId: string,
  client: PrismaClientOrTx = prisma,
) {
  const [articleCount, articleVoteCount] = await Promise.all([
    client.article.count({ where: { authorId: userId } }),
    client.articleVote.count({ where: { article: { authorId: userId } } }),
  ]);
  const points = articleCount * PROFILE_ARTICLE_POINTS + articleVoteCount * PROFILE_VOTE_POINTS;
  return { articleCount, articleVoteCount, points };
}

export async function getProfilePointValue(userId: string, client: PrismaClientOrTx = prisma) {
  const { points } = await getProfilePointComponents(userId, client);
  return points;
}

export async function getAvailableForumPoints(
  userId: string,
  spentPoints: number,
  client: PrismaClientOrTx = prisma,
) {
  const total = await getProfilePointValue(userId, client);
  return Math.max(0, total - spentPoints);
}

export async function computeTotalPowerScore(
  userId: string,
  battlePoints: number,
  client: PrismaClientOrTx = prisma,
) {
  const profilePoints = await getProfilePointValue(userId, client);
  return profilePoints + battlePoints;
}
