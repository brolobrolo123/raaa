"use client";

import { useState, useTransition } from "react";
import { ArrowBigUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface ArticleVoteButtonProps {
  articleId: string;
  initialScore: number;
  initiallyVoted?: boolean;
}

export function ArticleVoteButton({ articleId, initialScore, initiallyVoted = false }: ArticleVoteButtonProps) {
  const [score, setScore] = useState(initialScore);
  const [voted, setVoted] = useState(initiallyVoted);
  const [isPending, startTransition] = useTransition();

  const toggleVote = () => {
    startTransition(async () => {
      const response = await fetch(`/api/articles/${articleId}/vote`, { method: "POST" });
      if (!response.ok) return;
      const data = await response.json();
      setScore(data.score);
      setVoted((prev) => !prev);
    });
  };

  return (
    <Button
      type="button"
      variant={voted ? "primary" : "secondary"}
      loading={isPending}
      onClick={toggleVote}
      className={cn(
        "group rounded-3xl px-6 py-3 text-base text-white",
        voted
          ? "bg-linear-to-r from-emerald-400 via-sky-500 to-indigo-500 shadow-[0_10px_30px_rgba(59,130,246,0.35)]"
          : "bg-slate-900/80 text-white/90 hover:bg-slate-900",
      )}
    >
      <ArrowBigUp className={cn("h-4 w-4 transition", voted ? "text-white" : "text-slate-100/80 group-hover:text-white")} />
      <span className="font-semibold tracking-wide">{voted ? "Votaste" : "Votar"}</span>
      <span className="text-sm text-white/80">{score}</span>
      {voted && <Sparkles className="h-4 w-4 text-amber-200" />}
    </Button>
  );
}
