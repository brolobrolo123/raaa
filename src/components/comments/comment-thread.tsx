"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/user/user-avatar";
import { MiniProfileHoverCard } from "@/components/user/mini-profile-hover-card";
import type { CommentNodeDTO } from "@/types/content";
import { CommentComposer } from "./comment-composer";

interface CommentThreadProps {
  articleId: string;
  initialComments: CommentNodeDTO[];
  total: number;
}

export function CommentThread({ articleId, initialComments, total }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentNodeDTO[]>(initialComments);

  const addComment = (comment: CommentNodeDTO) => {
    setComments((prev) => [comment, ...prev]);
  };

  const addReply = (parentId: string, reply: CommentNodeDTO) => {
    const attach = (nodes: CommentNodeDTO[]): CommentNodeDTO[] =>
      nodes.map((node) => {
        if (node.id === parentId) {
          return { ...node, replies: [reply, ...node.replies] };
        }
        return { ...node, replies: attach(node.replies) };
      });
    setComments((prev) => attach(prev));
  };

  const commentCards = useMemo(() => comments, [comments]);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Comentarios ({total})</h2>
      </header>

      <Card className="border-white/5 bg-white/10 text-white">
        <CommentComposer articleId={articleId} onCreated={addComment} placeholder="Comparte tu postura" />
      </Card>

      <div className="space-y-4">
        {commentCards.map((comment) => (
          <CommentItem key={comment.id} comment={comment} articleId={articleId} onReplyCreated={addReply} />
        ))}
        {commentCards.length === 0 && (
          <Card className="border-white/10 bg-white/5 text-center text-slate-300">Todavía no hay comentarios.</Card>
        )}
      </div>
    </section>
  );
}

interface CommentItemProps {
  comment: CommentNodeDTO;
  articleId: string;
  onReplyCreated: (parentId: string, reply: CommentNodeDTO) => void;
}

function CommentItem({ comment, articleId, onReplyCreated }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [liked, setLiked] = useState(comment.likedByViewer);
  const [score, setScore] = useState(comment.score);
  const [isPending, startTransition] = useTransition();

  const toggleLike = () => {
    startTransition(async () => {
      const response = await fetch(`/api/comments/${comment.id}/vote`, { method: "POST" });
      if (!response.ok) return;
      const data = await response.json();
      if (data.removed) {
        setLiked(false);
        setScore((prev) => Math.max(0, prev - 1));
      } else {
        setLiked(true);
        setScore((prev) => prev + 1);
      }
    });
  };

  return (
    <Card className="space-y-3 border-white/5 bg-white/5 text-white">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <MiniProfileHoverCard username={comment.author.username}>
          <div className="flex items-center gap-2">
            <UserAvatar image={comment.author.image} size={34} className="border border-white/10" />
            <span>@{comment.author.username}</span>
          </div>
        </MiniProfileHoverCard>
        <span>{new Date(comment.createdAt).toLocaleString()}</span>
      </div>
      <p className="whitespace-pre-line text-base text-white/90">{comment.body}</p>
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <Button
          type="button"
          variant={liked ? "primary" : "ghost"}
          loading={isPending}
          onClick={toggleLike}
          className="rounded-2xl px-4 py-2"
        >
          👍 {score}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setShowReply((prev) => !prev)}>
          {showReply ? "Cancelar" : "Responder"}
        </Button>
      </div>
      {showReply && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <CommentComposer
            articleId={articleId}
            parentId={comment.id}
            placeholder="Responde al hilo"
            onCreated={(reply) => {
              onReplyCreated(comment.id, reply);
              setShowReply(false);
            }}
          />
        </div>
      )}
      {comment.replies.length > 0 && (
        <div className="space-y-3 border-l border-white/10 pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="space-y-2 rounded-2xl bg-white/5 p-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <MiniProfileHoverCard username={reply.author.username}>
                  <div className="flex items-center gap-2">
                    <UserAvatar image={reply.author.image} size={26} className="border border-white/10" />
                    <span>@{reply.author.username}</span>
                  </div>
                </MiniProfileHoverCard>
                <span>{new Date(reply.createdAt).toLocaleString()}</span>
              </div>
              <p className="whitespace-pre-line text-sm text-white/90">{reply.body}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
