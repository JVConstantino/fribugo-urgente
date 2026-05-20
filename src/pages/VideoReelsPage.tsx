import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  Home,
  Loader2,
  Play,
} from "lucide-react";

import {
  getArticleVideoThumbnailUrl,
  getArticleVideoUrl,
  listVideoArticles,
} from "@/services/supabase";
import type { Article } from "@/types";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";

const SWIPE_THRESHOLD = 48;

export default function VideoReelsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchVideos() {
      setLoading(true);
      try {
        const videos = await listVideoArticles(24);
        if (cancelled) return;
        setArticles(videos);
        const slugIndex = videos.findIndex((article) => article.slug === slug);
        setActiveIndex(slugIndex >= 0 ? slugIndex : 0);
      } catch {
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchVideos();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const activeArticle = articles[activeIndex] ?? null;
  const videoUrl = activeArticle ? getArticleVideoUrl(activeArticle) : null;
  const posterUrl = activeArticle ? getArticleVideoThumbnailUrl(activeArticle) : null;

  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex < articles.length - 1;

  const progressLabel = useMemo(() => {
    if (!activeArticle || articles.length === 0) return "";
    return `${activeIndex + 1}/${articles.length}`;
  }, [activeArticle, activeIndex, articles.length]);

  useEffect(() => {
    if (!activeArticle || activeArticle.slug === slug) return;
    navigate(`/videos/${activeArticle.slug}`, { replace: true });
  }, [activeArticle, navigate, slug]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    void video.play().catch(() => {});
  }, [activeArticle?.id]);

  function goToIndex(index: number) {
    if (index < 0 || index >= articles.length) return;
    setActiveIndex(index);
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartY.current === null) return;

    const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;
    const deltaY = endY - touchStartY.current;
    touchStartY.current = null;

    if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;
    if (deltaY < 0 && canGoNext) goToIndex(activeIndex + 1);
    if (deltaY > 0 && canGoPrevious) goToIndex(activeIndex - 1);
  }

  if (loading) {
    return (
      <main className="fixed inset-0 flex h-screen h-[100dvh] items-center justify-center overflow-hidden bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (!activeArticle || !videoUrl) {
    return (
      <main className="fixed inset-0 flex h-screen h-[100dvh] flex-col items-center justify-center gap-5 overflow-hidden bg-black px-6 text-center text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <Play className="h-6 w-6 fill-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Video indisponivel</h1>
          <p className="mt-2 max-w-sm text-sm text-white/65">
            Este video saiu dos reels de 24 horas ou nao esta mais publicado como destaque.
          </p>
        </div>
        <Button asChild>
          <Link to="/">
            <Home className="h-4 w-4" />
            Voltar para home
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <main
      className="fixed inset-0 h-screen h-[100dvh] touch-none overflow-hidden bg-black text-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        key={activeArticle.id}
        src={videoUrl}
        poster={posterUrl || undefined}
        autoPlay
        muted
        playsInline
        controls
        className="h-full w-full bg-black object-contain"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 via-black/20 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="bg-black/35 text-white hover:bg-black/55 hover:text-white">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white/85">
            {progressLabel}
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] pt-20 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto space-y-3">
          <p className="text-xs font-semibold uppercase text-white/60">
            {formatRelativeDate(activeArticle.publishedAt)}
          </p>
          <h1 className="line-clamp-3 text-xl font-bold leading-tight">
            {activeArticle.videoCaption || activeArticle.title}
          </h1>
          {activeArticle.excerpt && (
            <p className="line-clamp-2 text-sm leading-relaxed text-white/72">
              {activeArticle.excerpt}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="bg-white text-black hover:bg-white/90">
              <Link to={`/noticias/${activeArticle.slug}`}>
                Ler noticia
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <div className="ml-auto flex items-center gap-1 text-xs text-white/60">
              {canGoPrevious && <ArrowDown className="h-4 w-4" />}
              {canGoNext && <ArrowUp className="h-4 w-4" />}
              <span>Deslize</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
