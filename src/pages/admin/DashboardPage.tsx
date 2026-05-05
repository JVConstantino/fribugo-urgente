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
  ArrowUpRight,
  ArrowDownRight,
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

const CHART_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4",
];

const StatCard = ({
  icon: Icon,
  label,
  value,
  color = "text-foreground",
  sub,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
  trend?: "up" | "down" | null;
}) => (
  <Card className="relative overflow-hidden border-border/50 hover:border-border transition-colors">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
          </div>
          <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === "up" ? "text-emerald-500" : "text-red-500"
          }`}>
            {trend === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
          </div>
        )}
      </div>
      <div className="absolute -right-3 -bottom-3 opacity-[0.03]">
        <Icon className="h-24 w-24" />
      </div>
    </CardContent>
  </Card>
);

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
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral do portal</p>
        </div>
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
            <Card key={i}><CardContent className="p-5"><Skeleton className="mb-2 h-3 w-20" /><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard icon={FileText} label="Total de artigos" value={totalArticles} />
            <StatCard icon={Eye} label="Publicados" value={publishedCount} color="text-emerald-600" />
            <StatCard icon={Edit3} label="Rascunhos" value={draftCount} color="text-amber-600" />
            <StatCard icon={FolderOpen} label="Categorias" value={categories.length} />
          </>
        )}
      </div>

      {/* Stats Cards — Row 2 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="mb-2 h-3 w-20" /><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard icon={Zap} label="Urgentes" value={breakingCount} color="text-red-600" />
            <StatCard
              icon={BarChart2}
              label="Total de views"
              value={totalViews.toLocaleString("pt-BR")}
              sub="top 100 publicados"
            />
            <StatCard
              icon={Megaphone}
              label="Impressões ads"
              value={totalImpressions.toLocaleString("pt-BR")}
              sub={`CTR: ${ctr}% · ${totalClicks.toLocaleString("pt-BR")} cliques`}
            />
            <Card className="relative overflow-hidden border-border/50 hover:border-border transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Mais lido</span>
                </div>
                {mostViewed ? (
                  <>
                    <p className="mt-2 text-sm font-bold leading-tight line-clamp-2">{mostViewed.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {mostViewed.views.toLocaleString("pt-BR")} views
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">—</p>
                )}
                <div className="absolute -right-3 -bottom-3 opacity-[0.03]">
                  <Trophy className="h-24 w-24" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Top articles by views — takes 3 cols */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              Artigos mais lidos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : topViewsChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Sem dados de views ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topViewsChartData} layout="vertical" margin={{ left: 4, right: 20, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(v) => [(Number(v)).toLocaleString("pt-BR"), "Views"]}
                  />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Views per category — takes 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Views por categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : catViewsData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Sem dados ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={catViewsData}
                    dataKey="views"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {catViewsData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(v) => [(Number(v)).toLocaleString("pt-BR"), "Views"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ads performance chart + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {adPerformanceData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                Performance dos anúncios
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={adPerformanceData} margin={{ left: 4, right: 16, top: 8, bottom: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px" }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar dataKey="impressões" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="cliques" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className={adPerformanceData.length > 0 ? "" : "lg:col-span-3"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/artigos/novo">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  Novo artigo
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/artigos">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Gerenciar artigos
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/categorias">
                  <FolderOpen className="h-4 w-4 text-amber-500" />
                  Gerenciar categorias
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/anuncios">
                  <Megaphone className="h-4 w-4 text-purple-500" />
                  Gerenciar anúncios
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/grupos">
                  <BarChart2 className="h-4 w-4 text-cyan-500" />
                  Grupos WhatsApp
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Articles */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Artigos recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum artigo encontrado.</p>
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
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Urgente</Badge>
                            )}
                            <Badge variant={article.isPublished ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                              {article.isPublished ? "Publicado" : "Rascunho"}
                            </Badge>
                            {cat && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: cat.color, color: cat.color }}>
                                {cat.name}
                              </Badge>
                            )}
                          </div>
                          <Link to={`/admin/artigos/${article.id}/editar`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">
                            {article.title}
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
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Mais lidas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum artigo com views ainda.</p>
            ) : (
              <div className="space-y-0">
                {topArticles.slice(0, 5).map((article, index) => {
                  const cat = categoryMap.get(article.categoryId);
                  const rankColors = ["text-amber-500", "text-slate-400", "text-amber-700", "text-muted-foreground", "text-muted-foreground"];
                  return (
                    <div key={article.id}>
                      <div className="flex items-center gap-3 py-3">
                        <span className={`text-lg font-bold w-6 shrink-0 ${rankColors[index]}`}>
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <Link to={`/admin/artigos/${article.id}/editar`} className="text-sm font-medium hover:text-primary transition-colors block line-clamp-1">
                            {article.title}
                          </Link>
                          {cat && <span className="text-[11px]" style={{ color: cat.color }}>{cat.name}</span>}
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
