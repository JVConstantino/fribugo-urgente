import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, ExternalLink, Play, X } from "lucide-react";

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

function VideoCardContent({
  article,
  category,
}: {
  article: Article;
  category?: Category;
}) {
  const thumbnailUrl = getArticleVideoThumbnailUrl(article);

  return (
    <>
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
    </>
  );
}

interface VideoReelsCarouselProps {
  articles: Article[];
  categories: Category[];
}

export function VideoReelsCarousel({
  articles,
  categories,
}: VideoReelsCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  if (articles.length === 0) return null;

  const selected = selectedIndex !== null ? articles[selectedIndex] : null;
  const selectedVideoUrl = selected ? getArticleVideoUrl(selected) : null;
  const canGoPrevious = selectedIndex !== null && selectedIndex > 0;
  const canGoNext = selectedIndex !== null && selectedIndex < articles.length - 1;

  function goToSelectedVideo(direction: "previous" | "next") {
    setSelectedIndex((current) => {
      if (current === null) return current;
      const nextIndex = direction === "previous" ? current - 1 : current + 1;
      if (nextIndex < 0 || nextIndex >= articles.length) return current;
      return nextIndex;
    });
  }

  return (
    <section className="mb-8 overflow-hidden rounded-lg border border-border bg-secondary text-secondary-foreground">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-lg font-bold">Reels da noticia</h2>
          <p className="text-xs text-secondary-foreground/70">
            Videos rapidos dos ultimos acontecimentos
          </p>
        </div>
        <Link
          to="/buscar"
          className="hidden text-sm font-medium text-primary-foreground/85 transition-colors hover:text-primary-foreground sm:inline-flex"
        >
          Ver noticias
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-5 sm:px-5">
        {articles.map((article, index) => {
          const category = categoryMap.get(article.categoryId);
          const cardClass =
            "group relative aspect-[9/16] w-[132px] shrink-0 overflow-hidden rounded-lg bg-black text-left shadow-md ring-1 ring-white/10 transition-transform hover:-translate-y-0.5 hover:ring-primary sm:w-[156px]";

          return (
            <div key={article.id} className="shrink-0">
              <Link to={`/videos/${article.slug}`} className={`${cardClass} block sm:hidden`}>
                <VideoCardContent article={article} category={category} />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`${cardClass} hidden sm:block`}
              >
                <VideoCardContent article={article} category={category} />
              </button>
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <DialogContent className="max-w-5xl border-0 bg-black p-0 text-white sm:rounded-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>{selected?.title || "Video da noticia"}</DialogTitle>
          </DialogHeader>
          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            aria-label="Fechar video"
          >
            <X className="h-4 w-4" />
          </button>
          {selected && selectedVideoUrl && (
            <div className="grid overflow-hidden sm:grid-cols-[minmax(280px,420px)_minmax(280px,1fr)]">
              <div className="flex min-h-[70vh] items-center justify-center bg-black">
                <video
                  key={selected.id}
                  src={selectedVideoUrl}
                  poster={getArticleVideoThumbnailUrl(selected) || undefined}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[82vh] w-full bg-black object-contain"
                />
              </div>
              <div className="flex flex-col justify-between gap-5 bg-secondary p-5">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase text-primary">
                    Friburgo Urgente
                  </p>
                  <h3 className="text-2xl font-bold leading-tight">
                    {selected.title}
                  </h3>
                  {selected.excerpt && (
                    <div className="rounded-lg bg-background/55 p-4 text-secondary-foreground">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Resumo
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-secondary-foreground/85">
                        {selected.excerpt}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => goToSelectedVideo("previous")}
                      disabled={!canGoPrevious}
                      className="border-white/20 bg-black/20 text-white hover:bg-black/35 hover:text-white disabled:opacity-35"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-xs font-semibold text-secondary-foreground/65">
                      {(selectedIndex ?? 0) + 1}/{articles.length}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => goToSelectedVideo("next")}
                      disabled={!canGoNext}
                      className="border-white/20 bg-black/20 text-white hover:bg-black/35 hover:text-white disabled:opacity-35"
                    >
                      Proximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button asChild className="w-full">
                    <Link to={`/noticias/${selected.slug}`} onClick={() => setSelectedIndex(null)}>
                      Ler noticia completa
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
