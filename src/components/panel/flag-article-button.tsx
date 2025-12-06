"use client";

import { useState } from "react";

type FlagArticleButtonProps = {
  articleId: string;
};

export function FlagArticleButton({ articleId }: FlagArticleButtonProps) {
  const [status, setStatus] = useState<string | null>(null);

  async function flagArticle() {
    setStatus("Marcando...");
    try {
      const response = await fetch("/api/panel/articles/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, action: "flag" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Error inesperado");
      }
      setStatus("Enviado a revisión");
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  return (
    <button
      onClick={flagArticle}
      className="rounded-full bg-fuchsia-500/80 px-3 py-1 text-xs font-semibold text-white transition hover:bg-fuchsia-500"
    >
      {status ? status : "Enviar a revisión"}
    </button>
  );
}
