import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, ExternalLink, Play, X } from "lucide-react";

import type { Article, Category } from "@/types";
import {
  getArticleVideoThumbnailUrl,
  getArticleVideoUrl,
} from "@/services/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRelativeDate } from "@/lib/utils";

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds < 1) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

interface VideoReelsCarouselProps {
  articles: Article[];
  categories: Category[];
}

export function VideoReelsCarousel({
  articles,
  categories,
}: VideoReelsCarouselProps) {
  const [selected, setSelected] = useState<Article | null>(null);
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  if (articles.length === 0) return null;

  const selectedVideoUrl = selected ? getArticleVideoUrl(selected) : null;

  return (
    <section className="mb-8 overflow-hidden rounded-lg border border-border bg-secondary text-secondary-foreground">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-lg font-bold">Reels da notícia</h2>
          <p className="text-xs text-secondary-foreground/70">
            Vídeos rápidos dos últimos acontecimentos
          </p>
        </div>
        <Link
          to="/buscar"
          className="hidden text-sm font-medium text-primary-foreground/85 transition-colors hover:text-primary-foreground sm:inline-flex"
        >
          Ver notícias
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-5 sm:px-5">
        {articles.map((article) => {
          const thumbnailUrl = getArticleVideoThumbnailUrl(article);
          const category = categoryMap.get(article.categoryId);

          return (
            <button
              key={article.id}
              type="button"
              onClick={() => setSelected(article)}
              className="group relative aspect-[9/16] w-[132px] shrink-0 overflow-hidden rounded-lg bg-black text-left shadow-md ring-1 ring-white/10 transition-transform hover:-translate-y-0.5 hover:ring-primary sm:w-[156px]"
            >
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
              <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-semibold text-white">
                <Play className="h-3 w-3 fill-white" />
                {formatDuration(article.videoDurationSeconds)}
              </div>
              {category && (
                <div
                  className="absolute right-2 top-2 max-w-[72px] truncate rounded-full px-2 py-1 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name}
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="line-clamp-3 text-sm font-bold leading-tight text-white">
                  {article.videoCaption || article.title}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-white/75">
                  <Clock className="h-3 w-3" />
                  {formatRelativeDate(article.publishedAt)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl border-0 bg-black p-0 text-white sm:rounded-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>{selected?.title || "Vídeo da notícia"}</DialogTitle>
          </DialogHeader>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            aria-label="Fechar vídeo"
          >
            <X className="h-4 w-4" />
          </button>
          {selected && selectedVideoUrl && (
            <div className="grid overflow-hidden sm:grid-cols-[minmax(280px,420px)_1fr]">
              <div className="flex min-h-[70vh] items-center justify-center bg-black">
                <video
                  src={selectedVideoUrl}
                  poster={getArticleVideoThumbnailUrl(selected) || undefined}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[82vh] w-full bg-black object-contain"
                />
              </div>
              <div className="flex flex-col justify-end gap-4 bg-secondary p-5">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">
                    Friburgo Urgente
                  </p>
                  <h3 className="mt-2 text-2xl font-bold leading-tight">
                    {selected.title}
                  </h3>
                  {selected.excerpt && (
                    <p className="mt-3 text-sm text-secondary-foreground/75">
                      {selected.excerpt}
                    </p>
                  )}
                </div>
                <Button asChild className="w-full sm:w-fit">
                  <Link to={`/noticias/${selected.slug}`} onClick={() => setSelected(null)}>
                    Ler notícia completa
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
