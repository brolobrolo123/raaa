"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CommentNodeDTO } from "@/types/content";

interface CommentComposerProps {
  articleId: string;
  parentId?: string;
  placeholder?: string;
  onCreated?: (comment: CommentNodeDTO) => void;
}

export function CommentComposer({ articleId, parentId, placeholder, onCreated }: CommentComposerProps) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!value.trim()) {
      setMessage("Escribe algo antes de publicar.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: value, parentId }),
      });

      if (!response.ok) {
        setMessage("No se pudo comentar.");
        return;
      }

      const data = await response.json();
      const newComment: CommentNodeDTO = {
        id: data.comment.id,
        body: data.comment.body,
        parentId: data.comment.parentId,
        score: 0,
        likedByViewer: false,
        createdAt: data.comment.createdAt,
        author: data.comment.author,
        replies: [],
      };

      setValue("");
      setMessage(null);
      onCreated?.(newComment);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-3">
      <Textarea
        rows={parentId ? 2 : 3}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder ?? "Comparte tu reacción"}
      />
      {message && <p className="text-xs text-rose-300">{message}</p>}
      <div className="flex justify-end">
        <Button type="button" onClick={submit} loading={isPending}>
          Publicar
        </Button>
      </div>
    </div>
  );
}
