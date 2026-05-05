import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  Clock,
  ChevronRight,
  TrendingUp,
  Send,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  listArticles,
  listCategories,
  getArticleCoverUrl,
  subscribe,
} from "@/services/supabase";
import type { Article, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ITEMS_PER_PAGE,
  TRENDING_ARTICLES_COUNT,
  APP_NAME,
} from "@/lib/constants";
import { formatRelativeDate, truncate, getReadingTime } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { AdBanner } from "@/components/shared/AdBanner";
import PopupBanner from "@/components/shared/PopupBanner";

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);

  const fetchArticles = useCallback(
    async (pageNum: number, categoryId: string | null, append: boolean) => {
      const offset = pageNum * ITEMS_PER_PAGE;
      try {
        const filters: { isPublished?: boolean; categoryId?: string } = {
          isPublished: true,
        };
        if (categoryId) {
          filters.categoryId = categoryId;
        }
        const result = await listArticles(filters, ITEMS_PER_PAGE, offset);
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
    async function fetchData() {
      setLoading(true);
      try {
        const [catsResult, articlesResult] = await Promise.all([
          listCategories(),
          listArticles({ isPublished: true }, ITEMS_PER_PAGE, 0),
        ]);
        if (!cancelled) {
          setCategories(catsResult);
          setArticles(articlesResult.articles);
          setTotal(articlesResult.total);
        }
      } catch {
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchTrending() {
      try {
        const result = await listArticles(
          { isPublished: true },
          TRENDING_ARTICLES_COUNT,
          0
        );
        if (!cancelled) {
          setTrendingArticles(
            result.articles.sort((a, b) => b.views - a.views)
          );
        }
      } catch {
        if (!cancelled) setTrendingArticles([]);
      }
    }
    fetchTrending();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCategoryChange = useCallback(
    async (categoryId: string | null) => {
      setSelectedCategory(categoryId);
      setPage(0);
      setLoading(true);
      await fetchArticles(0, categoryId, false);
      setLoading(false);
    },
    [fetchArticles]
  );

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    await fetchArticles(nextPage, selectedCategory, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();
    if (!trimmed) return;

    setSubscribing(true);
    try {
      await subscribe(trimmed);
      toast({
        title: "Inscricao realizada!",
        description: "Voce recebera as principais noticies no seu e-mail.",
      });
      setNewsletterEmail("");
    } catch {
      toast({
        title: "Erro ao inscrever",
        description: "Nao foi possivel realizar a inscricao. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const hasMore = articles.length < total;
  const featuredArticle = articles[0];
  const gridArticles = articles;
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div>
      <PopupBanner />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero Section */}
        {loading ? (
          <HeroSkeleton />
        ) : featuredArticle ? (
          <HeroSection article={featuredArticle} category={categoryMap.get(featuredArticle.categoryId)} />
        ) : null}

        {/* Breaking News Badge */}
        {articles.some((a) => a.isBreaking) && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-semibold">Noticias urgentes agora</span>
          </div>
        )}

        {/* Banner Ad */}
        <AdBanner page="home" format="banner" className="mb-6" />

        {/* Category Filter Tabs */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.icon && <span className="text-base">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {loading ? (
              <ArticleGridSkeleton />
            ) : gridArticles.length > 0 ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2">
                  {gridArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      category={categoryMap.get(article.categoryId)}
                    />
                  ))}
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
                        <>Carregar mais noticias</>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhuma noticia encontrada.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Trending */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Mais lidas</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingArticles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma noticia em destaque.
                  </p>
                ) : (
                  trendingArticles.map((article, index) => (
                    <div key={article.id}>
                      <Link
                        to={`/noticias/${article.slug}`}
                        className="group flex gap-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {article.views}
                          </div>
                        </div>
                      </Link>
                      {index < trendingArticles.length - 1 && (
                        <Separator className="mt-3" />
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Sidebar Ad */}
            <AdBanner page="home" format="sidebar" />

            {/* Newsletter */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Newsletter</h3>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  Receba as principais noticies de {APP_NAME} no seu e-mail.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Seu e-mail"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    disabled={subscribing}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={subscribing || !newsletterEmail.trim()}
                  >
                    {subscribing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Inscrevendo...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Inscrever-se
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function HeroSection({
  article,
  category,
}: {
  article: Article;
  category?: Category;
}) {
  const coverUrl = getArticleCoverUrl(article);

  return (
    <Link to={`/noticias/${article.slug}`} className="group mb-8 block">
      <div className="relative overflow-hidden rounded-xl">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={article.title}
            className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-80 lg:h-96"
          />
        ) : (
          <div className="flex h-64 items-center justify-center bg-muted sm:h-80 lg:h-96">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-2">
            {article.isBreaking && (
              <Badge variant="destructive" className="text-xs">
                Urgente
              </Badge>
            )}
            {category && (
              <Badge
                style={{ backgroundColor: category.color, color: "#fff" }}
                className="text-xs flex items-center gap-1"
              >
                {category.icon && <span>{category.icon}</span>}
                {category.name}
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl leading-tight">
            {article.title}
          </h2>
          <div className="mt-2 flex items-center gap-3 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatRelativeDate(article.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {article.views}
            </span>
            <span className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              {getReadingTime(article.content)} min de leitura
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({
  article,
  category,
}: {
  article: Article;
  category?: Category;
}) {
  const coverUrl = getArticleCoverUrl(article);

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
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
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
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
          {category && (
            <Link to={`/categoria/${category.slug}`}>
              <Badge
                variant="secondary"
                className="text-xs flex items-center gap-1"
                style={{
                  backgroundColor: category.color,
                  color: "#fff",
                  borderColor: "transparent",
                }}
              >
                {category.icon && <span>{category.icon}</span>}
                {category.name}
              </Badge>
            </Link>
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
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {article.views}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-64 w-full rounded-xl sm:h-80 lg:h-96" />
    </div>
  );
}

function ArticleGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
