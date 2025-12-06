export interface OwnedBadgeDTO {
  id: string; // userBadgeId
  badgeId: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  earnedAt: string;
  featuredSlot: number | null;
}

export interface MiniProfileBadgeDTO {
  userBadgeId: string;
  badgeId: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  featuredSlot: number | null;
}

export interface MiniProfileDTO {
  username: string;
  avatar?: string | null;
  bio?: string | null;
  accentColor: string;
  joinedAt: string;
  lastSeenAt: string;
  stats: {
    articles: number;
    comments: number;
    votes: number;
    points: number;
  };
  battleStats: {
    total: number;
    wins: number;
    losses: number;
  } | null;
  topArticle: {
    id: string;
    title: string;
    score: number;
    createdAt: string;
  } | null;
  latestComment: {
    id: string;
    body: string;
    createdAt: string;
    articleId: string;
    articleTitle: string;
  } | null;
  badges: MiniProfileBadgeDTO[];
}
