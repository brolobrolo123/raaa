import { Prisma } from "@prisma/client";
import type { CommentNodeDTO } from "@/types/content";
import { prisma } from "./prisma";
import { SECTION_DEFINITIONS, getSectionTopics, isPrimarySectionSlug, type SectionSlug } from "./sections";

const articleSelect = {
  id: true,
  title: true,
  summary: true,
  createdAt: true,
  score: true,
  coverColor: true,
  coverImage: true,
  section: {
    select: { name: true, slug: true },
  },
  author: {
    select: { username: true, image: true, id: true },
  },
  _count: {
    select: { comments: true },
  },
};

type ArticlePreview = Prisma.ArticleGetPayload<{ select: typeof articleSelect }>;
type ArticlePreviewWithComment = ArticlePreview & {
  topComment?: {
    body: string;
    score: number;
    author: {
      username: string;
      image?: string | null;
    };
  } | null;
};

async function attachTopComments(articles: ArticlePreview[]): Promise<ArticlePreviewWithComment[]> {
  if (articles.length === 0) {
    return [];
  }

  const commentMap = new Map<string, ArticlePreviewWithComment["topComment"]>();
  await Promise.all(
    articles.map(async (article) => {
      const topComment = await prisma.comment.findFirst({
        where: { articleId: article.id, parentId: null },
        include: {
          author: { select: { username: true, image: true } },
          _count: { select: { votes: true } },
        },
        orderBy: [
          { votes: { _count: "desc" } },
          { createdAt: "desc" },
        ],
      });

      if (topComment) {
        commentMap.set(article.id, {
          body: topComment.body,
          score: topComment._count.votes,
          author: { username: topComment.author.username, image: topComment.author.image },
        });
      }
    }),
  );

  return articles.map((article) => ({
    ...article,
    topComment: commentMap.get(article.id) ?? null,
  }));
}

export async function getSectionSnapshot({
  slug,
  page = 1,
  view = "top",
}: {
  slug: SectionSlug;
  page?: number;
  view?: "top" | "recent";
}) {
  const normalizedView: "top" | "recent" = view === "recent" ? "recent" : "top";
  const normalizedPage = Math.max(1, page);
  const isPrimary = isPrimarySectionSlug(slug);
  const topicSlugs = isPrimary ? getSectionTopics(slug) : [];
  const aggregateSlugs = isPrimary ? [slug, ...topicSlugs] : [slug];

  const sectionRecords = await prisma.section.findMany({
    where: { slug: { in: aggregateSlugs } },
    select: { id: true, slug: true, name: true, description: true, accentColor: true },
  });

  const definition = SECTION_DEFINITIONS[slug];
  const currentSectionRecord = sectionRecords.find((record) => record.slug === slug);
  const fallbackSection = {
    id: currentSectionRecord?.id ?? null,
    slug,
    name: currentSectionRecord?.name ?? definition?.name.es ?? slug,
    description: currentSectionRecord?.description ?? definition?.description.es ?? "",
    accentColor: currentSectionRecord?.accentColor ?? definition?.accentColor ?? "#2563eb",
  };

  const sectionIds = isPrimary
    ? sectionRecords.map((record) => record.id)
    : currentSectionRecord?.id
      ? [currentSectionRecord.id]
      : [];

  const topPageSize = isPrimary ? 6 : 4;
  const recentPageSize = 6;
  const applyTopPagination = isPrimary && normalizedView === "top";
  const applyRecentPagination = isPrimary && normalizedView === "recent";

  let topArticles: ArticlePreviewWithComment[] = [];
  let recentArticles: ArticlePreviewWithComment[] = [];
  let hasMoreTop = false;
  let hasMoreRecent = false;

  if (sectionIds.length > 0) {
    const rawTopArticles = (await prisma.article.findMany({
      where: { sectionId: { in: sectionIds } },
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      skip: applyTopPagination ? (normalizedPage - 1) * topPageSize : 0,
      take: topPageSize + (applyTopPagination ? 1 : 0),
      select: articleSelect,
    })) as unknown as ArticlePreview[];
    hasMoreTop = applyTopPagination && rawTopArticles.length > topPageSize;
    topArticles = await attachTopComments(rawTopArticles.slice(0, topPageSize));

    const rawRecentArticles = (await prisma.article.findMany({
      where: { sectionId: { in: sectionIds } },
      orderBy: { createdAt: "desc" },
      skip: applyRecentPagination ? (normalizedPage - 1) * recentPageSize : 0,
      take: recentPageSize + (applyRecentPagination ? 1 : 0),
      select: articleSelect,
    })) as unknown as ArticlePreview[];
    hasMoreRecent = applyRecentPagination && rawRecentArticles.length > recentPageSize;
    recentArticles = await attachTopComments(rawRecentArticles.slice(0, recentPageSize));
  }

  return {
    section: fallbackSection,
    topArticles,
    recentArticles,
    hasMoreTop,
    hasMoreRecent,
    page: normalizedPage,
    view: normalizedView,
    isPrimary,
  };
}

export async function getArticleWithMeta(articleId: string, userId?: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      author: { select: { username: true, image: true } },
      section: true,
      _count: { select: { comments: true } },
    },
  });

  if (!article) {
    return null;
  }

  let hasVoted = false;
  if (userId) {
    const vote = await prisma.articleVote.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId,
        },
      },
    });
    hasVoted = Boolean(vote);
  }

  return { article, hasVoted };
}

export type CommentNode = {
  id: string;
  body: string;
  parentId: string | null;
  score: number;
  createdAt: Date;
  author: {
    username: string;
    image: string | null;
  };
  replies: CommentNode[];
  likedByViewer: boolean;
};

export async function getCommentBundle(
  articleId: string,
  mode: "mix" | "top" | "recent" = "mix",
  userId?: string,
) {
  const comments = await prisma.comment.findMany({
    where: { articleId },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true, image: true } },
      votes: { select: { value: true, userId: true } },
    },
  });

  const nodes = comments.map((comment) => ({
    id: comment.id,
    body: comment.body,
    parentId: comment.parentId,
    createdAt: comment.createdAt,
    author: comment.author,
    score: comment.votes.reduce((acc, vote) => acc + vote.value, 0),
    likedByViewer: userId ? comment.votes.some((vote) => vote.value === 1 && vote.userId === userId) : false,
    replies: [] as CommentNode[],
  }));

  const map = new Map<string, CommentNode>();
  nodes.forEach((node) => map.set(node.id, node));

  const roots: CommentNode[] = [];
  nodes.forEach((node) => {
    if (node.parentId) {
      const parent = map.get(node.parentId);
      if (parent) {
        parent.replies.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  const sortByScore = (a: CommentNode, b: CommentNode) => b.score - a.score;
  const sortByRecent = (a: CommentNode, b: CommentNode) =>
    b.createdAt.getTime() - a.createdAt.getTime();

  roots.forEach((root) => root.replies.sort(sortByRecent));

  let payload: CommentNode[] = [];
  if (mode === "top") {
    payload = [...roots].sort(sortByScore);
  } else if (mode === "recent") {
    payload = [...roots].sort(sortByRecent);
  } else {
    const curated: CommentNode[] = [];
    const ranked = [...roots].sort(sortByScore).slice(0, 3);
    const fresh = [...roots].sort(sortByRecent).slice(0, 5);
    [...ranked, ...fresh].forEach((node) => {
      if (!curated.find((item) => item.id === node.id)) {
        curated.push(node);
      }
    });
    payload = curated;
  }

  return {
    total: roots.length,
    comments: payload,
    mode,
  };
}

export function serializeCommentNodes(nodes: CommentNode[]): CommentNodeDTO[] {
  return nodes.map((node) => ({
    id: node.id,
    body: node.body,
    parentId: node.parentId,
    score: node.score,
    createdAt: node.createdAt.toISOString(),
    likedByViewer: node.likedByViewer,
    author: node.author,
    replies: serializeCommentNodes(node.replies),
  }));
}
