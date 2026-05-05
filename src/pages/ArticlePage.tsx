import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Clock,
  Eye,
  Share2,
  Copy,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import {
  getArticle,
  getArticleCoverUrl,
  incrementViews,
  listArticles,
  listCategories,
  getMostViewedArticles,
} from "@/services/supabase";
import type { Article, Category } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  APP_NAME,
  APP_URL,
  RELATED_ARTICLES_COUNT,
} from "@/lib/constants";
import { formatRelativeDate, getReadingTime, truncate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { AdBanner } from "@/components/shared/AdBanner";

function splitContent(html: string): [string, string] {
  const tag = "</p>";
  const indices: number[] = [];
  let pos = 0;
  while ((pos = html.indexOf(tag, pos)) !== -1) {
    indices.push(pos + tag.length);
    pos += tag.length;
  }
  if (indices.length < 2) return [html, ""];
  const midIdx = indices[Math.floor(indices.length / 2)];
  return [html.slice(0, midIdx), html.slice(midIdx)];
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [topArticles, setTopArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchArticle() {
      if (!slug) return;
      setLoading(true);
      setNotFound(false);

      try {
        const found = await getArticle(slug);
        if (!found) {
          if (!cancelled) setNotFound(true);
          return;
        }

        if (!cancelled) {
          setArticle(found);
        }

        // Increment views (fire and forget)
        incrementViews(found.id).catch(() => {});

        // Fetch category, related articles and top viewed
        const [categories, relatedResult, topResult] = await Promise.all([
          listCategories(),
          listArticles(
            { isPublished: true, categoryId: found.categoryId },
            RELATED_ARTICLES_COUNT + 1,
            0
          ),
          getMostViewedArticles(5),
        ]);

        if (!cancelled) {
          const cat = categories.find((c) => c.id === found.categoryId) ?? null;
          setCategory(cat);
          setAllCategories(categories);
          setRelatedArticles(
            relatedResult.articles.filter((a) => a.id !== found.id).slice(0, RELATED_ARTICLES_COUNT)
          );
          setTopArticles(topResult.filter((a) => a.id !== found.id).slice(0, 5));
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchArticle();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${APP_URL}/noticias/${article?.slug}`);
      toast({ title: "Link copiado!", description: "O link foi copiado para a area de transferencia." });
    } catch {
      toast({ title: "Erro ao copiar", description: "Nao foi possivel copiar o link.", variant: "destructive" });
    }
  };

  const handleShareWhatsApp = () => {
    const url = `${APP_URL}/noticias/${article?.slug}`;
    const text = `Confira esta noticia: ${article?.title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
  };

  const handleShareFacebook = () => {
    const url = `${APP_URL}/noticias/${article?.slug}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  if (loading) {
    return <ArticlePageSkeleton />;
  }

  if (notFound || !article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-bold">Noticia nao encontrada</h1>
        <p className="mb-8 text-muted-foreground">
          A noticia que voce procura nao existe ou foi removida.
        </p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao inicio
          </Link>
        </Button>
      </div>
    );
  }

  const coverUrl = getArticleCoverUrl(article);
  const readingTime = getReadingTime(article.content);
  const [contentFirst, contentSecond] = splitContent(article.content);

  return (
    <>
      <Helmet>
        <title>{`${article.title} - ${APP_NAME}`}</title>
        <meta name="description" content={article.excerpt} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        {coverUrl && <meta property="og:image" content={coverUrl} />}
      </Helmet>

      <article>
        {/* Cover Image */}
        {coverUrl && (
          <div className="relative max-h-[500px] overflow-hidden">
            <img
              src={coverUrl}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* Main content column */}
            <div className="min-w-0">
              {/* Category & Meta */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {article.isBreaking && (
                  <Badge variant="destructive">Urgente</Badge>
                )}
                {category && (
                  <Link to={`/categoria/${category.slug}`}>
                    <Badge
                      style={{ backgroundColor: category.color, color: "#fff", borderColor: "transparent" }}
                    >
                      {category.name}
                    </Badge>
                  </Link>
                )}
              </div>

              {/* Title */}
              <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">
                {article.title}
              </h1>

              {/* Meta info */}
              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatRelativeDate(article.publishedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {article.views} visualizacoes
                </span>
                <span>{readingTime} min de leitura</span>
              </div>

              <Separator className="mb-8" />

              {/* Content — split with banner ad in middle */}
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: contentFirst }}
              />
              {contentSecond && (
                <>
                  <AdBanner page="article" format="banner" className="my-6" />
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: contentSecond }}
                  />
                </>
              )}

              {/* Banner ad at end of content */}
              <AdBanner page="article" format="banner" className="mt-6" />

              {/* Mobile-only: share, top articles, categories, tags */}
              <div className="lg:hidden mt-8 space-y-6">
                {/* Share */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compartilhar</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                      <Copy className="h-4 w-4" />
                      Copiar link
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShareFacebook}>
                      <Share2 className="h-4 w-4" />
                      Facebook
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {allCategories.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categorias</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {allCategories.map((c) => (
                        <Link key={c.id} to={`/categoria/${c.slug}`}>
                          <Badge style={{ backgroundColor: c.color, color: "#fff", borderColor: "transparent" }}>
                            {c.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mais lidas */}
                {topArticles.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mais lidas</h3>
                    <div className="space-y-3">
                      {topArticles.map((a, i) => (
                        <Link key={a.id} to={`/noticias/${a.slug}`} className="flex items-start gap-2 group">
                          <span className="text-xl font-black text-muted-foreground/25 leading-tight shrink-0 w-5">{i + 1}</span>
                          <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-3">{a.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <section className="mt-12">
                  <h2 className="mb-6 text-2xl font-bold">Noticias relacionadas</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {relatedArticles.map((related) => {
                      const relCover = getArticleCoverUrl(related);
                      return (
                        <Link
                          key={related.id}
                          to={`/noticias/${related.slug}`}
                          className="group"
                        >
                          <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                            {relCover ? (
                              <div className="h-40 overflow-hidden">
                                <img
                                  src={relCover}
                                  alt={related.title}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                            ) : null}
                            <CardContent className="p-4">
                              <h3 className="line-clamp-2 font-semibold group-hover:text-primary transition-colors">
                                {related.title}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {truncate(related.excerpt, 100)}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar column */}
            <aside className="hidden lg:block">
              <div className="sticky top-4 space-y-6">
                {/* Share */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Compartilhar
                  </h3>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="justify-start" onClick={handleCopyLink}>
                      <Copy className="h-4 w-4" />
                      Copiar link
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start" onClick={handleShareWhatsApp}>
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start" onClick={handleShareFacebook}>
                      <Share2 className="h-4 w-4" />
                      Facebook
                    </Button>
                  </div>
                </div>

                <AdBanner page="article" format="sidebar" maxCount={3} />

                {topArticles.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Mais lidas
                    </h3>
                    <div className="space-y-3">
                      {topArticles.map((a, i) => (
                        <Link
                          key={a.id}
                          to={`/noticias/${a.slug}`}
                          className="flex items-start gap-2 group"
                        >
                          <span className="text-xl font-black text-muted-foreground/25 leading-tight shrink-0 w-5">
                            {i + 1}
                          </span>
                          <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-3">
                            {a.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {relatedArticles.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Relacionadas
                    </h3>
                    <div className="space-y-3">
                      {relatedArticles.map((a) => {
                        const rc = getArticleCoverUrl(a);
                        return (
                          <Link
                            key={a.id}
                            to={`/noticias/${a.slug}`}
                            className="flex gap-2 group"
                          >
                            {rc && (
                              <img
                                src={rc}
                                alt={a.title}
                                className="h-12 w-12 shrink-0 rounded object-cover"
                              />
                            )}
                            <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-3">
                              {a.title}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {allCategories.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Categorias
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {allCategories.map((c) => (
                        <Link key={c.id} to={`/categoria/${c.slug}`}>
                          <Badge
                            style={{
                              backgroundColor: c.color,
                              color: "#fff",
                              borderColor: "transparent",
                            }}
                          >
                            {c.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}

function ArticlePageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Skeleton className="mb-4 h-6 w-24" />
      <Skeleton className="mb-4 h-8 w-3/4" />
      <Skeleton className="mb-2 h-10 w-full" />
      <Skeleton className="mb-6 h-4 w-1/2" />
      <Separator className="mb-8" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}
