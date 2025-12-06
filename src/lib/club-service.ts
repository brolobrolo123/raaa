import type { ClubMemberRole, ClubModeratorRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/moderation";
import { CLUB_DEFINITIONS } from "@/lib/clubs";
import type { Role } from "@/types/roles";

export type ClubMessageAttachmentPayload = {
  type: "image" | "gif";
  url: string;
  alt?: string | null;
};

export type ClubMessageView = {
  id: string;
  body: string;
  createdAt: string;
  attachments: ClubMessageAttachmentPayload[];
  author: {
    id: string;
    username: string;
    image: string | null;
  };
};

export type ClubModeratorProfile = {
  userId: string;
  username: string;
  image: string | null;
  sprite: string | null;
  role: ClubMemberRole;
};

export type ClubViewerState = {
  isMember: boolean;
  membershipRole: ClubMemberRole | null;
  canChat: boolean;
  canModerate: boolean;
  mutedUntil: string | null;
  suspendedUntil: string | null;
  isBanned: boolean;
  moderatorRequestStatus: ClubModeratorRequestStatus | null;
};

export type ClubSummary = {
  id: string;
  slug: string;
  name: string;
  description: string;
  tagline: string;
  icon: string;
  accentColor: string;
  heroGradient: string;
  welcomeMessage: string;
  rules: string[];
};

export type ClubSummaryWithViewer = ClubSummary & {
  memberCount: number;
  viewerMembership: {
    role: ClubMemberRole;
    joinedAt: string;
  } | null;
};

export type ClubPollOptionView = {
  index: number;
  label: string;
  votes: number;
  percentage: number;
};

export type ClubPollView = {
  id: string;
  question: string;
  createdAt: string;
  expiresAt: string | null;
  durationMinutes: number;
  options: ClubPollOptionView[];
  totalVotes: number;
  viewerVote: number | null;
  createdBy: {
    id: string;
    username: string;
    image: string | null;
  };
};

function buildFallbackClubs(): ClubSummaryWithViewer[] {
  return Object.values(CLUB_DEFINITIONS).map((club) => ({
    id: club.slug,
    slug: club.slug,
    name: club.name,
    description: club.description,
    tagline: club.tagline,
    icon: club.icon,
    accentColor: club.accentColor,
    heroGradient: club.heroGradient,
    welcomeMessage: club.welcomeMessage,
    rules: club.rules,
    memberCount: 0,
    viewerMembership: null,
  }));
}

function toStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function toAttachmentArray(value: Prisma.JsonValue | null | undefined): ClubMessageAttachmentPayload[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  const attachments: ClubMessageAttachmentPayload[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const type = record.type === "gif" ? "gif" : record.type === "image" ? "image" : null;
    const url = typeof record.url === "string" ? record.url : null;
    if (!type || !url) {
      continue;
    }
    const alt = typeof record.alt === "string" ? record.alt : null;
    attachments.push({ type, url, alt });
  }
  return attachments;
}

function normalizePollOptions(value: Prisma.JsonValue | null | undefined): string[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry): entry is string => entry.length > 0);
}

export async function getClubsForViewer(userId: string): Promise<ClubSummaryWithViewer[]> {
  const [clubs, memberships, counts] = await Promise.all([
    prisma.club.findMany({ orderBy: { name: "asc" } }),
    prisma.clubMembership.findMany({ where: { userId } }),
    prisma.clubMembership.groupBy({ by: ["clubId"], _count: { _all: true } }),
  ]);

  if (clubs.length === 0) {
    return buildFallbackClubs();
  }

  const membershipByClub = new Map(memberships.map((entry) => [entry.clubId, entry]));
  const countByClub = new Map(counts.map((entry) => [entry.clubId, entry._count._all]));

  return clubs.map((club) => {
    const membership = membershipByClub.get(club.id);
    return {
      id: club.id,
      slug: club.slug,
      name: club.name,
      description: club.description,
      tagline: club.tagline,
      icon: club.icon,
      accentColor: club.accentColor,
      heroGradient: club.heroGradient,
      welcomeMessage: club.welcomeMessage,
      rules: toStringArray(club.rules),
      memberCount: countByClub.get(club.id) ?? 0,
      viewerMembership: membership
        ? { role: membership.role, joinedAt: membership.joinedAt.toISOString() }
        : null,
    } satisfies ClubSummaryWithViewer;
  });
}

export async function getClubDetailForViewer(slug: string, userId: string, viewerRole?: Role) {
  const club = await prisma.club.findUnique({ where: { slug } });
  if (!club) {
    return null;
  }

  const [membership, memberCount, moderators, messages, polls, disciplineState, moderatorRequest] = await Promise.all([
    prisma.clubMembership.findUnique({
      where: {
        clubId_userId: { clubId: club.id, userId },
      },
    }),
    prisma.clubMembership.count({ where: { clubId: club.id } }),
    prisma.clubMembership.findMany({
      where: { clubId: club.id, role: { in: ["MODERATOR", "OWNER"] } },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
            fabPixelSprite: true,
          },
        },
      },
      orderBy: { role: "desc" },
    }),
    getClubMessageFeed(club.id),
    getClubPollViews(club.id, userId),
    getActiveClubDisciplineState(club.id, userId),
    prisma.clubModeratorRequest.findUnique({
      where: {
        clubId_userId: {
          clubId: club.id,
          userId,
        },
      },
    }),
  ]);

  const moderatorProfiles: ClubModeratorProfile[] = moderators.map((entry) => ({
    userId: entry.user.id,
    username: entry.user.username,
    image: entry.user.image,
    sprite: entry.user.fabPixelSprite ?? null,
    role: entry.role,
  }));

  const penaltyMap = disciplineState;
  const isClubModerator = membership?.role === "MODERATOR" || membership?.role === "OWNER";
  const canModerate = Boolean(isClubModerator || isAdminRole(viewerRole));
  const muted = Boolean(penaltyMap.mutedUntil);
  const suspended = Boolean(penaltyMap.suspendedUntil);
  const isBanned = penaltyMap.isBanned;

  const viewerState: ClubViewerState = {
    isMember: Boolean(membership) && !isBanned && !suspended,
    membershipRole: membership?.role ?? null,
    canChat: Boolean(membership) && !muted && !isBanned && !suspended,
    canModerate,
    mutedUntil: penaltyMap.mutedUntil,
    suspendedUntil: penaltyMap.suspendedUntil,
    isBanned,
    moderatorRequestStatus: moderatorRequest?.status ?? null,
  };

  return {
    club: {
      id: club.id,
      slug: club.slug,
      name: club.name,
      description: club.description,
      tagline: club.tagline,
      icon: club.icon,
      accentColor: club.accentColor,
      heroGradient: club.heroGradient,
      welcomeMessage: club.welcomeMessage,
      rules: toStringArray(club.rules),
    } satisfies ClubSummary,
    memberCount,
    moderators: moderatorProfiles,
    viewer: viewerState,
    messages,
    polls,
  };
}

export type ClubDisciplineState = {
  isBanned: boolean;
  banExpiresAt: string | null;
  mutedUntil: string | null;
  suspendedUntil: string | null;
};

export async function getActiveClubDisciplineState(clubId: string, userId: string): Promise<ClubDisciplineState> {
  const rows = await prisma.clubDiscipline.findMany({
    where: {
      clubId,
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  return rows.reduce<ClubDisciplineState>(
    (acc, penalty) => {
      const expiresAt = penalty.expiresAt?.toISOString() ?? null;
      switch (penalty.type) {
        case "BAN":
          acc.isBanned = true;
          acc.banExpiresAt = expiresAt;
          break;
        case "SILENCE":
          acc.mutedUntil = expiresAt;
          break;
        case "SUSPENSION":
          acc.suspendedUntil = expiresAt;
          break;
        default:
          break;
      }
      return acc;
    },
    {
      isBanned: false,
      banExpiresAt: null,
      mutedUntil: null,
      suspendedUntil: null,
    },
  );
}

export async function getClubMessageFeed(clubId: string, limit = 50): Promise<ClubMessageView[]> {
  const messages = await prisma.clubMessage.findMany({
    where: { clubId },
    include: {
      author: { select: { id: true, username: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return messages.reverse().map((message) => ({
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    attachments: toAttachmentArray(message.attachments),
    author: {
      id: message.author.id,
      username: message.author.username,
      image: message.author.image,
    },
  }));
}

export async function getClubPollViews(clubId: string, viewerId: string): Promise<ClubPollView[]> {
  const now = new Date();
  const polls = await prisma.clubPoll.findMany({
    where: {
      clubId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (polls.length === 0) {
    return [];
  }

  const pollIds = polls.map((poll) => poll.id);

  const [voteGroups, viewerVotes] = await Promise.all([
    prisma.clubPollVote.groupBy({
      by: ["pollId", "optionIndex"],
      where: { pollId: { in: pollIds } },
      _count: { _all: true },
    }),
    prisma.clubPollVote.findMany({
      where: { pollId: { in: pollIds }, userId: viewerId },
      select: { pollId: true, optionIndex: true },
    }),
  ]);

  const viewerVoteMap = new Map(viewerVotes.map((vote) => [vote.pollId, vote.optionIndex]));
  const countMap = new Map<string, Map<number, number>>();
  voteGroups.forEach((group) => {
    let optionMap = countMap.get(group.pollId);
    if (!optionMap) {
      optionMap = new Map();
      countMap.set(group.pollId, optionMap);
    }
    optionMap.set(group.optionIndex, group._count._all);
  });

  return polls.map((poll) => {
    const labels = normalizePollOptions(poll.options);
    const optionCounts = countMap.get(poll.id) ?? new Map<number, number>();
    const options = labels.map((label, index) => ({
      index,
      label,
      votes: optionCounts.get(index) ?? 0,
      percentage: 0,
    }));
    const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);
    const enrichedOptions = options.map((option) => ({
      ...option,
      percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0,
    }));

    return {
      id: poll.id,
      question: poll.question,
      createdAt: poll.createdAt.toISOString(),
      expiresAt: poll.expiresAt ? poll.expiresAt.toISOString() : null,
      durationMinutes: poll.durationMinutes,
      options: enrichedOptions,
      totalVotes,
      viewerVote: viewerVoteMap.get(poll.id) ?? null,
      createdBy: {
        id: poll.createdBy.id,
        username: poll.createdBy.username,
        image: poll.createdBy.image,
      },
    } satisfies ClubPollView;
  });
}
