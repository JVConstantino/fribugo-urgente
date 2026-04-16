import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Clock, Eye, ArrowLeft, Loader2 } from "lucide-react";
import { searchArticles, listCategories, getArticleCoverUrl } from "@/services/appwrite";
import type { Article, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ITEMS_PER_PAGE, APP_NAME } from "@/lib/constants";
import { formatRelativeDate, truncate, getReadingTime } from "@/lib/utils";
import { Helmet } from "react-helmet-async";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(query);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const fetchArticles = useCallback(
    async (searchQuery: string, pageNum: number, append: boolean) => {
      const offset = pageNum * ITEMS_PER_PAGE;
      try {
        const result = await searchArticles(searchQuery, ITEMS_PER_PAGE, offset);
        if (append) {
          setArticles((prev) => [...prev, ...result.articles]);
        } else {
          setArticles(result.articles);
        }
        setTotal(result.total);
      } catch {
        if (!append) setArticles([]);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const cats = await listCategories();
        if (!cancelled) setCategories(cats);
      } catch {
        // ignore
      }
    }

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!query) {
      setArticles([]);
      setTotal(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setPage(0);

    fetchArticles(query, 0, false).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [query, fetchArticles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
    }
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    await fetchArticles(query, nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const hasMore = articles.length < total;

  return (
    <>
      <Helmet>
        <title>{query ? `Buscar "${query}" - ${APP_NAME}` : `Buscar - ${APP_NAME}`}</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="mb-4 text-3xl font-bold">Buscar noticias</h1>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Digite sua busca..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={!inputValue.trim()}>
              Buscar
            </Button>
          </form>
        </div>

        {query && (
          <p className="mb-6 text-sm text-muted-foreground">
            {total} resultado{total !== 1 ? "s" : ""} para &quot;{query}&quot;
          </p>
        )}

        {/* Results */}
        {loading ? (
          <SearchResultsSkeleton />
        ) : articles.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => {
                const coverUrl = getArticleCoverUrl(article);
                const cat = categoryMap.get(article.categoryId);
                return (
                  <Card key={article.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
                    <Link to={`/noticias/${article.slug}`}>
                      {coverUrl ? (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={coverUrl}
                            alt={article.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-muted">
                          <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </Link>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center gap-2">
                        {article.isBreaking && (
                          <Badge variant="destructive" className="text-xs">
                            Urgente
                          </Badge>
                        )}
                        {cat && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: cat.color,
                              color: "#fff",
                              borderColor: "transparent",
                            }}
                          >
                            {cat.name}
                          </Badge>
                        )}
                      </div>
                      <Link to={`/noticias/${article.slug}`}>
                        <h3 className="mb-1 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                      </Link>
                      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                        {truncate(article.excerpt, 120)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeDate(article.publishedAt)}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.views}
                          </span>
                          <span>{getReadingTime(article.content)} min</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar mais resultados"
                  )}
                </Button>
              </div>
            )}
          </>
        ) : query ? (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h2 className="mb-2 text-xl font-semibold">Nenhum resultado encontrado</h2>
            <p className="text-muted-foreground">
              Tente buscar com outras palavras-chave.
            </p>
          </div>
        ) : (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h2 className="mb-2 text-xl font-semibold">Buscar noticias</h2>
            <p className="text-muted-foreground">
              Digite um termo para buscar entre as noticias publicadas.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
