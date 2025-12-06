import { prisma } from "./prisma";
import { broadcastNotificationUpdate } from "./notification-stream";

export type NotificationType =
  | "ARTICLE_COMMENT"
  | "COMMENT_REPLY"
  | "COMMENT_LIKE"
  | "MODERATION_ALERT"
  | "MODERATION_PENALTY";

interface CommentNotificationInput {
  articleId: string;
  articleAuthorId?: string | null;
  parentAuthorId?: string | null;
  commentId: string;
  actorId: string;
  actorName?: string | null;
}

export async function recordCommentNotifications(input: CommentNotificationInput) {
  const { articleId, articleAuthorId, parentAuthorId, commentId, actorId, actorName } = input;
  const actorLabel = actorName?.trim() || "Alguien";
  const targets = new Map<string, { type: NotificationType; message: string }>();

  if (articleAuthorId && articleAuthorId !== actorId) {
    targets.set(articleAuthorId, {
      type: "ARTICLE_COMMENT",
      message: `${actorLabel} comentó tu artículo`,
    });
  }

  if (parentAuthorId && parentAuthorId !== actorId) {
    const alreadyTargeted = targets.has(parentAuthorId);
    targets.set(parentAuthorId, {
      type: "COMMENT_REPLY",
      message: `${actorLabel} respondió tu comentario`,
    });
    if (alreadyTargeted && articleAuthorId === parentAuthorId) {
      // Already stored but we prefer the reply context
      targets.set(parentAuthorId, {
        type: "COMMENT_REPLY",
        message: `${actorLabel} respondió tu comentario`,
      });
    }
  }

  if (targets.size === 0) {
    return;
  }

  const data = Array.from(targets.entries()).map(([userId, payload]) => ({
    userId,
    actorId,
    articleId,
    commentId,
    type: payload.type,
    message: payload.message,
  }));

  await prisma.notification.createMany({ data });
  for (const userId of targets.keys()) {
    broadcastNotificationUpdate(userId);
  }
}

interface CommentLikeNotificationInput {
  commentId: string;
  commentAuthorId: string;
  articleId: string;
  actorId: string;
  actorName?: string | null;
}

export async function recordCommentLikeNotification(input: CommentLikeNotificationInput) {
  const { commentAuthorId, actorId, articleId, commentId, actorName } = input;
  if (!commentAuthorId || commentAuthorId === actorId) {
    return;
  }

  const actorLabel = actorName?.trim() || "Alguien";
  await prisma.notification.create({
    data: {
      userId: commentAuthorId,
      actorId,
      articleId,
      commentId,
      type: "COMMENT_LIKE",
      message: `${actorLabel} le dio like a tu comentario`,
    },
  });
  broadcastNotificationUpdate(commentAuthorId);
}

interface ModerationAlertInput {
  userId: string;
  actorId: string;
  alertIndex: number;
}

export async function sendModerationAlertNotification({ userId, actorId, alertIndex }: ModerationAlertInput) {
  const message = `El equipo de moderación te envió una alerta. (${alertIndex}/3)`;
  await prisma.notification.create({
    data: {
      userId,
      actorId,
      type: "MODERATION_ALERT",
      message,
    },
  });
  broadcastNotificationUpdate(userId);
}

interface ModerationPenaltyInput {
  userId: string;
  actorId: string;
}

export async function sendModerationPenaltyNotification({ userId, actorId }: ModerationPenaltyInput) {
  const message = "Acumulaste tres alertas y fuiste baneado por una semana.";
  await prisma.notification.create({
    data: {
      userId,
      actorId,
      type: "MODERATION_PENALTY",
      message,
    },
  });
  broadcastNotificationUpdate(userId);
}

export async function getNotificationsPayload(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        message: true,
        createdAt: true,
        readAt: true,
        type: true,
        articleId: true,
        commentId: true,
        actor: { select: { username: true } },
        article: { select: { id: true, title: true } },
      },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  const items = notifications.map((notification) => ({
    ...notification,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
  }));

  return { notifications: items, unread: unreadCount };
}

export async function markNotificationsAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
