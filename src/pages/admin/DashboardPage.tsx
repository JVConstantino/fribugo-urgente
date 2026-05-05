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
  Mail,
  Inbox,
  AlertCircle,
  Settings,
  MessageCircle,
  Users,
  MousePointerClick,
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
  AreaChart,
  Area,
} from "recharts";
import {
  listArticles,
  listCategories,
  getMostViewedArticles,
  listAds,
  listNewsletterSubscribers,
  listUserNews,
  getTopCities,
  getViewsByDay,
} from "@/services/supabase";
import type { Article, Category, Ad, Newsletter, UserNews } from "@/types";
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

type AdPeriod = "week" | "month" | "all";

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
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
            {trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          </div>
        )}
      </div>
      <div className="absolute -right-3 -bottom-3 opacity-[0.03]">
        <Icon className="h-24 w-24" />
      </div>
    </CardContent>
  </Card>
);

function getDateDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function DashboardPage() {
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [topArticles, setTopArticles] = useState<Article[]>([]);
  const [top100Articles, setTop100Articles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [newsletter, setNewsletter] = useState<Newsletter[]>([]);
  const [userNewsList, setUserNewsList] = useState<UserNews[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [breakingCount, setBreakingCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [mostViewed, setMostViewed] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [adPeriod, setAdPeriod] = useState<AdPeriod>("all");
  const [topCities, setTopCities] = useState<{ city: string; count: number }[]>([]);
  const [viewsByDay, setViewsByDay] = useState<{ date: string; views: number }[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
        p.catch((e) => { console.warn("[Dashboard]", e?.message ?? e); return fallback; });

      const [recent, published, drafts, breaking, top100, top5, cats, adsData, nl, userNews, cities, viewsDay] =
        await Promise.all([
          safe(listArticles(undefined, 5, 0), { articles: [], total: 0 }),
          safe(listArticles({ isPublished: true }, 1, 0), { articles: [], total: 0 }),
          safe(listArticles({ isPublished: false }, 1, 0), { articles: [], total: 0 }),
          safe(listArticles({ isBreaking: true }, 1, 0), { articles: [], total: 0 }),
          safe(listArticles({ isPublished: true }, 100, 0), { articles: [], total: 0 }),
          safe(getMostViewedArticles(10), [] as Article[]),
          safe(listCategories(), [] as Category[]),
          safe(listAds(), [] as Ad[]),
          safe(listNewsletterSubscribers(), [] as Newsletter[]),
          safe(listUserNews(), [] as UserNews[]),
          safe(getTopCities(10), [] as { city: string; count: number }[]),
          safe(getViewsByDay(30), [] as { date: string; views: number }[]),
        ]);

      if (!cancelled) {
        setRecentArticles(recent.articles);
        setTotalArticles(recent.total);
        setPublishedCount(published.total);
        setDraftCount(drafts.total);
        setBreakingCount(breaking.total);
        setTotalViews(top100.articles.reduce((sum, a) => sum + (a.views || 0), 0));
        setMostViewed(top5[0] ?? null);
        setTopArticles(top5);
        setTop100Articles(top100.articles);
        setCategories(cats);
        setAds(adsData);
        setNewsletter(nl);
        setUserNewsList(userNews);
        setTopCities(cities);
        setViewsByDay(viewsDay);
        setLoading(false);
      }
    }

    fetchData().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Newsletter stats
  const newsletterActive = newsletter.filter((n) => n.isActive).length;
  const newsletterByChannel = {
    email: newsletter.filter((n) => n.isActive && n.channel === "email").length,
    whatsapp: newsletter.filter((n) => n.isActive && n.channel === "whatsapp").length,
    both: newsletter.filter((n) => n.isActive && n.channel === "both").length,
  };

  // UserNews stats
  const userNewsStats = {
    pending: userNewsList.filter((u) => u.status === "pending").length,
    processing: userNewsList.filter((u) => u.status === "processing").length,
    processed: userNewsList.filter((u) => u.status === "processed").length,
    rejected: userNewsList.filter((u) => u.status === "rejected").length,
  };

  // Ads period filter
  const now = new Date();
  const weekAgo = getDateDaysAgo(7);
  const monthAgo = getDateDaysAgo(30);

  const filteredAds = ads.filter((ad) => {
    if (adPeriod === "all") return true;
    const cutoff = adPeriod === "week" ? weekAgo : monthAgo;
    return new Date(ad.endsAt) >= cutoff;
  });

  const activeAdsCount = ads.filter((a) => {
    return a.isActive && new Date(a.startsAt) <= now && new Date(a.endsAt) >= now;
  }).length;

  // Charts
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

      {/* Stats Row 1 — Artigos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="mb-2 h-3 w-20" /><Skeleton className="h-8 w-16" /></CardContent></Card>
        )) : (
          <>
            <StatCard icon={FileText} label="Total de artigos" value={totalArticles} />
            <StatCard icon={Eye} label="Publicados" value={publishedCount} color="text-emerald-600" />
            <StatCard icon={Edit3} label="Rascunhos" value={draftCount} color="text-amber-600" />
            <StatCard icon={Zap} label="Urgentes" value={breakingCount} color="text-red-600" />
          </>
        )}
      </div>

      {/* Stats Row 2 — Views + Ads */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="mb-2 h-3 w-20" /><Skeleton className="h-8 w-16" /></CardContent></Card>
        )) : (
          <>
            <StatCard icon={BarChart2} label="Total de views" value={totalViews.toLocaleString("pt-BR")} sub="top 100 publicados" />
            <StatCard icon={Megaphone} label="Anúncios ativos" value={activeAdsCount} sub={`${ads.length} total`} color="text-purple-600" />
            <StatCard icon={MousePointerClick} label="CTR anúncios" value={`${ctr}%`} sub={`${totalImpressions.toLocaleString("pt-BR")} impressões`} />
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
                      <Eye className="h-3 w-3" />{mostViewed.views.toLocaleString("pt-BR")} views
                    </p>
                  </>
                ) : <p className="mt-2 text-sm text-muted-foreground">—</p>}
                <div className="absolute -right-3 -bottom-3 opacity-[0.03]"><Trophy className="h-24 w-24" /></div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Stats Row 3 — Newsletter + Internautas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="mb-2 h-3 w-20" /><Skeleton className="h-8 w-16" /></CardContent></Card>
        )) : (
          <>
            <StatCard
              icon={Mail}
              label="Inscritos newsletter"
              value={newsletterActive}
              color="text-blue-600"
              sub={`Email: ${newsletterByChannel.email} · Zap: ${newsletterByChannel.whatsapp} · Ambos: ${newsletterByChannel.both}`}
            />
            <StatCard
              icon={Inbox}
              label="Notícias internautas"
              value={userNewsList.length}
              sub={`${userNewsStats.pending} pendente${userNewsStats.pending !== 1 ? "s" : ""}`}
              color={userNewsStats.pending > 0 ? "text-amber-600" : "text-foreground"}
            />
            <StatCard icon={FolderOpen} label="Categorias" value={categories.length} />
            <Card className="relative overflow-hidden border-border/50 hover:border-border transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Inbox className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Status internautas</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                    Pendente: {userNewsStats.pending}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                    Processando: {userNewsStats.processing}
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                    Processado: {userNewsStats.processed}
                  </Badge>
                  <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                    Rejeitado: {userNewsStats.rejected}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Row 1 — Artigos mais lidos + Views por categoria */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              Artigos mais lidos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <Skeleton className="h-64 w-full rounded-lg" /> : topViewsChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Sem dados de views ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topViewsChartData} layout="vertical" margin={{ left: 4, right: 20, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [(Number(v)).toLocaleString("pt-BR"), "Views"]} />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Views por categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <Skeleton className="h-64 w-full rounded-lg" /> : catViewsData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Sem dados ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={catViewsData} dataKey="views" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50} paddingAngle={2} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {catViewsData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [(Number(v)).toLocaleString("pt-BR"), "Views"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 — Views por dia (linha) + Performance ads */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Acessos — últimos 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <Skeleton className="h-48 w-full rounded-lg" /> : viewsByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Sem dados de acessos ainda. Os dados serão coletados conforme leitores acessarem os artigos.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={viewsByDay} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [v, "Acessos"]} />
                  <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#viewsGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {adPerformanceData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                Performance dos anúncios
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={adPerformanceData} margin={{ left: 4, right: 16, top: 8, bottom: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-25} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="impressões" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="cliques" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Cidades */}
      {!loading && topCities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              Top cidades por acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topCities.map(c => ({ name: c.city, acessos: c.count }))} layout="vertical" margin={{ left: 8, right: 20, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [v, "Acessos"]} />
                <Bar dataKey="acessos" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Heatmap de categorias */}
      {!loading && categories.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Distribuição de artigos por categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {categories.map((cat) => {
                const count = top100Articles.filter(a => a.categoryId === cat.id).length;
                const maxCount = Math.max(...categories.map(c => top100Articles.filter(a => a.categoryId === c.id).length), 1);
                const intensity = count / maxCount;
                return (
                  <div
                    key={cat.id}
                    className="rounded-lg p-3 text-center transition-transform hover:scale-105"
                    style={{ backgroundColor: `${cat.color}${Math.round(intensity * 0.8 * 255).toString(16).padStart(2, '0')}` }}
                  >
                    <p className="text-2xl font-bold" style={{ color: intensity > 0.5 ? '#fff' : cat.color }}>{count}</p>
                    <p className="text-xs font-medium mt-1 truncate" style={{ color: intensity > 0.5 ? '#ffffffcc' : 'inherit' }}>{cat.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: intensity > 0.5 ? '#ffffff99' : 'hsl(var(--muted-foreground))' }}>artigos</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anúncios com filtro de período */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              Anúncios
            </CardTitle>
            <div className="flex gap-1">
              {(["week", "month", "all"] as AdPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setAdPeriod(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    adPeriod === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p === "week" ? "Semana" : p === "month" ? "Mês" : "Todos"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filteredAds.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum anúncio encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Formato</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Impressões</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cliques</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">CTR</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Período</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map((ad) => {
                    const adCtr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
                    const isRunning = ad.isActive && new Date(ad.startsAt) <= now && new Date(ad.endsAt) >= now;
                    return (
                      <tr key={ad.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          <Link to="/admin/anuncios" className="hover:text-primary transition-colors line-clamp-1">
                            {ad.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{ad.format}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{ad.impressions.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{ad.clicks.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${Number(adCtr) > 2 ? "text-emerald-600" : "text-muted-foreground"}`}>
                            {adCtr}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={isRunning ? "default" : "secondary"} className="text-xs">
                            {isRunning ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(ad.startsAt).toLocaleDateString("pt-BR")} →{" "}
                          {new Date(ad.endsAt).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions + Recent + Top */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/artigos/novo"><Plus className="h-4 w-4 text-emerald-500" />Novo artigo</Link>
              </Button>
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/artigos"><FileText className="h-4 w-4 text-blue-500" />Gerenciar artigos</Link>
              </Button>
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/categorias"><FolderOpen className="h-4 w-4 text-amber-500" />Categorias</Link>
              </Button>
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/anuncios"><Megaphone className="h-4 w-4 text-purple-500" />Anúncios</Link>
              </Button>
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/popups"><AlertCircle className="h-4 w-4 text-orange-500" />Popups</Link>
              </Button>
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/newsletter"><Mail className="h-4 w-4 text-blue-400" />Newsletter</Link>
              </Button>
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/noticias-internautas"><Inbox className="h-4 w-4 text-emerald-500" />Notícias internautas</Link>
              </Button>
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/grupos"><MessageCircle className="h-4 w-4 text-cyan-500" />Grupos WhatsApp</Link>
              </Button>
              <Button variant="outline" className="justify-start h-10" asChild>
                <Link to="/admin/configuracoes"><Settings className="h-4 w-4 text-muted-foreground" />Configurações</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

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
              <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex items-center gap-4"><Skeleton className="h-4 w-8" /><Skeleton className="h-4 flex-1" /></div>)}</div>
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
                            {article.isBreaking && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Urgente</Badge>}
                            <Badge variant={article.isPublished ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                              {article.isPublished ? "Publicado" : "Rascunho"}
                            </Badge>
                            {cat && <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: cat.color, color: cat.color }}>{cat.name}</Badge>}
                          </div>
                          <Link to={`/admin/artigos/${article.id}/editar`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">
                            {article.title}
                          </Link>
                        </div>
                        <div className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground sm:flex">
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{article.views}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatRelativeDate(article.publishedAt || article.createdAt)}</span>
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
              <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex items-center gap-4"><Skeleton className="h-4 w-6" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-12" /></div>)}</div>
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
                        <span className={`text-lg font-bold w-6 shrink-0 ${rankColors[index]}`}>{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <Link to={`/admin/artigos/${article.id}/editar`} className="text-sm font-medium hover:text-primary transition-colors block line-clamp-1">
                            {article.title}
                          </Link>
                          {cat && <span className="text-[11px]" style={{ color: cat.color }}>{cat.name}</span>}
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
                          <Eye className="h-3 w-3" />{article.views.toLocaleString("pt-BR")}
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

      {/* Newsletter inscritos por canal */}
      {!loading && newsletterActive > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Inscritos newsletter por canal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Mail className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-600">{newsletterByChannel.email}</p>
                <p className="text-xs text-muted-foreground">Email</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <MessageCircle className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald-600">{newsletterByChannel.whatsapp}</p>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <Users className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-600">{newsletterByChannel.both}</p>
                <p className="text-xs text-muted-foreground">Ambos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
