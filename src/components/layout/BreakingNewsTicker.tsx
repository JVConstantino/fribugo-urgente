import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { listArticles } from "@/services/appwrite";
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

  const headlines = articles
    .map((article) => article.title)
    .join("  \u2022\u2022\u2022  ");

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
            {articles.map((article, index) => (
              <span key={article.id}>
                <Link
                  to={`/noticias/${article.slug}`}
                  className="hover:underline hover:opacity-90 transition-opacity"
                >
                  {article.title}
                </Link>
                {index < articles.length - 1 && (
                  <span className="mx-4 opacity-60">
                    {"\u2022\u2022\u2022"}
                  </span>
                )}
              </span>
            ))}
            <span className="mx-8 opacity-40">{headlines}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
