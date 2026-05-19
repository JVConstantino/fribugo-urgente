import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { listArticles } from "@/services/supabase";
import type { Article } from "@/types";
import { BREAKING_TICKER_SPEED } from "@/lib/constants";

export function BreakingNewsTicker() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchBreaking() {
      try {
        const { articles: breakingArticles } = await listArticles(
          { isBreaking: true, isPublished: true },
          5,
          0
        );
        if (!cancelled) {
          setArticles(breakingArticles);
        }
      } catch {
        if (!cancelled) {
          setArticles([]);
        }
      }
    }

    fetchBreaking();

    const interval = setInterval(fetchBreaking, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (articles.length === 0) {
    return null;
  }

  const renderHeadlines = (hidden?: boolean) => (
    <div className="breaking-ticker-group" aria-hidden={hidden}>
      {articles.map((article) => (
        <span key={`${hidden ? "copy" : "main"}-${article.id}`} className="breaking-ticker-item">
          <Link
            to={`/noticias/${article.slug}`}
            className="hover:underline hover:opacity-90 transition-opacity"
            tabIndex={hidden ? -1 : undefined}
          >
            {article.title}
          </Link>
          <span className="breaking-ticker-separator" aria-hidden="true">
            {"\u2022\u2022\u2022"}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="bg-primary text-primary-foreground overflow-hidden">
      <div className="flex items-center">
        <div className="flex items-center gap-2 bg-destructive px-4 py-2 font-bold text-sm shrink-0 uppercase tracking-wide">
          <AlertTriangle className="h-4 w-4" />
          Urgente
        </div>
        <div className="overflow-hidden flex-1 py-2">
          <div
            className="breaking-ticker text-sm font-medium"
            style={{
              ["--ticker-duration" as string]: `${BREAKING_TICKER_SPEED}s`,
            }}
          >
            {renderHeadlines()}
            {renderHeadlines(true)}
          </div>
        </div>
      </div>
    </div>
  );
}
