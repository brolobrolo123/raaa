import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowUpRight, MessageCircleMore } from "lucide-react";
import type { Article } from "@/types/content";
import { cn } from "@/lib/cn";
import { getCoverBackgroundStyles, getCoverBorderColor } from "@/lib/media";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user/user-avatar";
import { MiniProfileHoverCard } from "@/components/user/mini-profile-hover-card";

interface ArticleCardProps {
  article: Article;
  highlight?: boolean;
  compact?: boolean;
}

export function ArticleCard({ article, highlight = false, compact = false }: ArticleCardProps) {
  const cardStyle: CSSProperties = {
    ...getCoverBackgroundStyles(article.coverImage, article.coverColor),
    borderColor: getCoverBorderColor(article.coverImage, article.coverColor),
  };
  if (highlight) {
    cardStyle.boxShadow = "0 15px 50px rgba(2,6,23,0.35)";
  }
  const summaryPreview = truncateWords(article.summary, 16);
  const showSectionLabel = !highlight;
  const summaryText = highlight ? article.summary : summaryPreview;

  return (
    <Link
      href={`/articles/${article.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-3xl border border-white/10 p-5 text-white transition-all hover:-translate-y-1 hover:border-white/50",
        highlight && "ring-2 ring-white/40",
      )}
      style={cardStyle}
    >
      <div
        className={cn(
          "flex items-center text-xs uppercase tracking-wide text-slate-300",
          showSectionLabel ? "justify-between" : "justify-end",
        )}
      >
        {showSectionLabel && <span>{article.section.name}</span>}
        <span className="flex items-center gap-3 text-xs text-slate-200">
          <span className="inline-flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" />
            {article.score}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircleMore className="h-3 w-3" />
            {article._count.comments}
          </span>
        </span>
      </div>
      <div className="space-y-1">
        <h3 className={cn("font-semibold", compact ? "text-lg" : "text-2xl")}>{article.title}</h3>
        {!compact && <p className="text-sm text-slate-200">{summaryText}</p>}
      </div>
      {highlight && article.topComment && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/90">
          <p className="text-sm text-white/80">&ldquo;{article.topComment.body}&rdquo;</p>
          <div className="mt-3 flex items-center justify-between text-xs text-white/70">
            <MiniProfileHoverCard username={article.topComment.author.username}>
              <div className="flex items-center gap-2">
                <UserAvatar image={article.topComment.author.image} size={24} />
                <span>@{article.topComment.author.username}</span>
              </div>
            </MiniProfileHoverCard>
            <span>{article.topComment.score} votos</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-slate-300">
        <MiniProfileHoverCard username={article.author.username}>
          <div className="flex items-center gap-2">
            <UserAvatar image={article.author.image} size={30} className="border border-white/15" />
            <span>@{article.author.username}</span>
          </div>
        </MiniProfileHoverCard>
        <Badge tone="muted">{new Date(article.createdAt).toLocaleDateString()}</Badge>
      </div>
    </Link>
  );
}

function truncateWords(text: string, maxWords: number) {
  const trimmed = text?.trim();
  if (!trimmed) return "";
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) {
    return trimmed;
  }
  return `${words.slice(0, maxWords).join(" ")}...`;
}
