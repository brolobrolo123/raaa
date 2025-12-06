import { notFound, redirect } from "next/navigation";
import { ArticleVoteButton } from "@/components/article/article-vote-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CommentThread } from "@/components/comments/comment-thread";
import { FullReloadLink } from "@/components/navigation/full-reload-link";
import { UserAvatar } from "@/components/user/user-avatar";
import { MiniProfileHoverCard } from "@/components/user/mini-profile-hover-card";
import { getArticleWithMeta, getCommentBundle, serializeCommentNodes } from "@/lib/article-service";
import { requireUser } from "@/lib/session";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ comments?: string; section?: string }>;
}

export default async function ArticlePage(props: ArticlePageProps) {
  const session = await requireUser();
  const [{ id }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const articleResult = await getArticleWithMeta(id, session.user.id);
  if (!articleResult) {
    notFound();
  }

  const { article, hasVoted } = articleResult;
  const requestedSectionSlug = searchParams.section;
  const expectedSectionSlug = article.section.slug;
  if (requestedSectionSlug !== expectedSectionSlug) {
    const params = new URLSearchParams();
    params.set("section", expectedSectionSlug);
    if (searchParams.comments) {
      params.set("comments", searchParams.comments);
    }
    redirect(`/articles/${article.id}?${params.toString()}`);
  }

  const commentMode =
    searchParams.comments === "top" || searchParams.comments === "recent"
      ? (searchParams.comments as "top" | "recent")
      : "mix";

  const commentBundle = await getCommentBundle(id, commentMode, session.user.id);
  const serialized = serializeCommentNodes(commentBundle.comments);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16 text-white">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <FullReloadLink href={`/sections/${article.section.slug}`} className="hover:text-white">
          ← Volver a {article.section.name}
        </FullReloadLink>
      </div>

      <article className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">{article.section.name}</p>
          <h1 className="text-4xl font-semibold">{article.title}</h1>
          <p className="text-lg text-slate-200">{article.summary}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <MiniProfileHoverCard username={article.author.username}>
              <div className="flex items-center gap-2">
                <UserAvatar image={article.author.image} size={40} className="border border-white/10" />
                <span>@{article.author.username}</span>
              </div>
            </MiniProfileHoverCard>
            <span>{new Date(article.createdAt).toLocaleString()}</span>
            <ArticleVoteButton articleId={article.id} initialScore={article.score} initiallyVoted={hasVoted} />
          </div>
        </div>
        <Card className="space-y-4 border-white/10 bg-white/5 text-white">
          <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
        </Card>
      </article>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <span>Comentarios:</span>
        <Button
          asChild
          variant={commentMode === "top" ? "primary" : "ghost"}
          className="rounded-2xl border border-white/15 bg-white/10 px-5 py-2 text-white/80 hover:bg-white/20"
        >
          <FullReloadLink href={`/articles/${article.id}?comments=top`}>
            Más votados
          </FullReloadLink>
        </Button>
        <Button
          asChild
          variant={commentMode === "recent" ? "primary" : "ghost"}
          className="rounded-2xl border border-white/15 bg-white/10 px-5 py-2 text-white/80 hover:bg-white/20"
        >
          <FullReloadLink href={`/articles/${article.id}?comments=recent`}>
            Recientes
          </FullReloadLink>
        </Button>
      </div>

      <CommentThread articleId={article.id} initialComments={serialized} total={commentBundle.total} />
    </main>
  );
}
