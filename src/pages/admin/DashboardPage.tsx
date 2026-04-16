import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  FolderOpen,
  Eye,
  Edit3,
  Plus,
  TrendingUp,
  Clock,
  Zap,
  BarChart2,
  Trophy,
  Megaphone,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  listArticles,
  listCategories,
  getMostViewedArticles,
  listAds,
} from "@/services/appwrite";
import type { Article, Category, Ad } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatRelativeDate, truncate } from "@/lib/utils";

const CHART_COLORS = ["#dc2626", "#f97316", "#2563eb", "#16a34a", "#9333ea", "#0891b2", "#d97706", "#db2777"];

export default function DashboardPage() {
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [topArticles, setTopArticles] = useState<Article[]>([]);
  const [top100Articles, setTop100Articles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [breakingCount, setBreakingCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [mostViewed, setMostViewed] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
        p.catch((e) => { console.warn("[Dashboard]", e?.message ?? e); return fallback; });

      const [recent, published, drafts, breaking, top100, top5, cats, adsData] =
        await Promise.all([
          safe(listArticles(undefined, 5, 0), { articles: [], total: 0 }),
          safe(listArticles({ isPublished: true }, 1, 0), { articles: [], total: 0 }),
          safe(listArticles({ isPublished: false }, 1, 0), { articles: [], total: 0 }),
          safe(listArticles({ isBreaking: true }, 1, 0), { articles: [], total: 0 }),
          safe(listArticles({ isPublished: true }, 100, 0), { articles: [], total: 0 }),
          safe(getMostViewedArticles(10), [] as Article[]),
          safe(listCategories(), [] as Category[]),
          safe(listAds(), [] as Ad[]),
        ]);

      if (!cancelled) {
        setRecentArticles(recent.articles);
        setTotalArticles(recent.total);
        setPublishedCount(published.total);
        setDraftCount(drafts.total);
        setBreakingCount(breaking.total);
        setTotalViews(
          top100.articles.reduce((sum, a) => sum + (a.views || 0), 0)
        );
        setMostViewed(top5[0] ?? null);
        setTopArticles(top5);
        setTop100Articles(top100.articles);
        setCategories(cats);
        setAds(adsData);
        setLoading(false);
      }
    }

    fetchData().finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Chart data
  const topViewsChartData = topArticles
    .filter((a) => a.views > 0)
    .map((a) => ({ name: truncate(a.title, 30), views: a.views }));

  const adPerformanceData = ads
    .filter((a) => a.impressions > 0 || a.clicks > 0)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8)
    .map((a) => ({
      name: truncate(a.title, 22),
      impressões: a.impressions,
      cliques: a.clicks,
    }));

  const catViewsData = Object.entries(
    top100Articles.reduce((acc, a) => {
      const cat = categoryMap.get(a.categoryId);
      if (cat) acc[cat.name] = (acc[cat.name] || 0) + a.views;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, views]) => ({ name, views }))
    .sort((a, b) => b.views - a.views);

  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link to="/admin/artigos/novo">
            <Plus className="h-4 w-4" />
            Novo artigo
          </Link>
        </Button>
      </div>

      {/* Stats Cards — Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="mb-2 h-4 w-24" /><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Total de artigos</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{totalArticles}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">Publicados</span>
                </div>
                <p className="mt-2 text-3xl font-bold text-green-600">{publishedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Edit3 className="h-4 w-4" />
                  <span className="text-sm font-medium">Rascunhos</span>
                </div>
                <p className="mt-2 text-3xl font-bold text-yellow-600">{draftCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FolderOpen className="h-4 w-4" />
                  <span className="text-sm font-medium">Categorias</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{categories.length}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Stats Cards — Row 2 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="mb-2 h-4 w-24" /><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Urgentes</span>
                </div>
                <p className="mt-2 text-3xl font-bold text-destructive">{breakingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BarChart2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Total de views</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{totalViews.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground mt-1">top 100 publicados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Megaphone className="h-4 w-4" />
                  <span className="text-sm font-medium">Impressões (ads)</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{totalImpressions.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground mt-1">CTR: {ctr}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-medium">Mais lido</span>
                </div>
                {mostViewed ? (
                  <>
                    <p className="mt-2 text-base font-bold leading-tight">{truncate(mostViewed.title, 40)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{mostViewed.views.toLocaleString("pt-BR")} views</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top articles by views */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Artigos mais lidos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : topViewsChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de views ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topViewsChartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [(Number(v)).toLocaleString("pt-BR"), "Views"]} />
                  <Bar dataKey="views" fill="#dc2626" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Views per category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Páginas mais acessadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : catViewsData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={catViewsData}
                    dataKey="views"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {catViewsData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [(Number(v)).toLocaleString("pt-BR"), "Views"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ads performance chart */}
      {!loading && adPerformanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance dos anúncios</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adPerformanceData} margin={{ left: 8, right: 16, top: 4, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="impressões" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cliques" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link to="/admin/artigos/novo">
                <Plus className="h-4 w-4" />
                Novo artigo
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/artigos">
                <FileText className="h-4 w-4" />
                Gerenciar artigos
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/categorias">
                <FolderOpen className="h-4 w-4" />
                Gerenciar categorias
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/anuncios">
                <BarChart2 className="h-4 w-4" />
                Gerenciar anúncios
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Artigos recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : recentArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum artigo encontrado.</p>
            ) : (
              <div className="space-y-0">
                {recentArticles.map((article, index) => {
                  const cat = categoryMap.get(article.categoryId);
                  return (
                    <div key={article.id}>
                      <div className="flex items-center gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            {article.isBreaking && (
                              <Badge variant="destructive" className="text-xs">Urgente</Badge>
                            )}
                            <Badge variant={article.isPublished ? "default" : "secondary"} className="text-xs">
                              {article.isPublished ? "Publicado" : "Rascunho"}
                            </Badge>
                            {cat && (
                              <Badge variant="outline" className="text-xs" style={{ borderColor: cat.color, color: cat.color }}>
                                {cat.name}
                              </Badge>
                            )}
                          </div>
                          <Link to={`/admin/artigos/${article.id}/editar`} className="text-sm font-medium hover:text-primary transition-colors">
                            {truncate(article.title, 55)}
                          </Link>
                        </div>
                        <div className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground sm:flex">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {article.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeDate(article.publishedAt || article.createdAt)}
                          </span>
                        </div>
                      </div>
                      {index < recentArticles.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Most Viewed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mais lidas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-6" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : topArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum artigo com views ainda.</p>
            ) : (
              <div className="space-y-0">
                {topArticles.slice(0, 5).map((article, index) => {
                  const cat = categoryMap.get(article.categoryId);
                  return (
                    <div key={article.id}>
                      <div className="flex items-center gap-3 py-3">
                        <span className="text-sm font-bold text-muted-foreground w-5 shrink-0">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <Link to={`/admin/artigos/${article.id}/editar`} className="text-sm font-medium hover:text-primary transition-colors block">
                            {truncate(article.title, 55)}
                          </Link>
                          {cat && <span className="text-xs" style={{ color: cat.color }}>{cat.name}</span>}
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.views.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      {index < topArticles.slice(0, 5).length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
