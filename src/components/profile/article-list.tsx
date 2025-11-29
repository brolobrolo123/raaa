"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProfileArticleListProps {
  articles: Array<{
    id: string;
    title: string;
    summary: string;
    createdAt: string;
    score: number;
    section: {
      name: string;
      slug: string;
    };
  }>;
}

export function ProfileArticleList({ articles }: ProfileArticleListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async (articleId: string) => {
    if (!confirm("¿Seguro que deseas borrar este artículo?")) return;
    setDeletingId(articleId);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/articles/${articleId}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(typeof data?.error === "string" ? data.error : "No se pudo eliminar el artículo.");
        return;
      }
      router.refresh();
    } catch {
      setErrorMessage("Error inesperado al eliminar.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}
      <ul className="space-y-4">
        {articles.map((article) => (
          <li key={article.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
              <span>{article.section.name}</span>
              <span>{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(article.createdAt))}</span>
            </div>
            <Link href={`/articles/${article.id}`} className="mt-3 block text-lg font-semibold text-white transition hover:text-sky-200">
              {article.title}
            </Link>
            <p className="mt-2 text-sm text-slate-200">{article.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>Votos: {article.score}</span>
              <Link href={`/sections/${article.section.slug}`} className="text-sky-300 hover:text-sky-200">
                Ver sección
              </Link>
              <Button
                type="button"
                variant="ghost"
                className="ml-auto border border-transparent text-rose-300 hover:border-rose-200/30 hover:bg-white/5 hover:text-rose-200"
                onClick={() => handleDelete(article.id)}
                disabled={deletingId === article.id}
              >
                {deletingId === article.id ? "Eliminando..." : "Borrar"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
