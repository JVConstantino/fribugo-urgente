import { useEffect, useState } from "react";
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
  FolderOpen,
  BarChart2,
  TrendingUp,
  Megaphone,
} from "lucide-react";
import {
  listArticles,
  listCategories,
  getMostViewedArticles,
  listAds,
  listUserNews,
  getTopCities,
  getViewsByDay,
} from "@/services/supabase";
import type { Article, Category, Ad, UserNews } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { truncate } from "@/lib/utils";
import MapChart, { type MapPoint, resolveCityCoords, resolveLocationCoords } from "@/components/admin/MapChart";

const CHART_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4",
];

type AdPeriod = "week" | "month" | "all";
type TimePeriod = "7d" | "30d" | "90d";

function getDateDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDaysFromPeriod(period: TimePeriod): number {
  return period === "7d" ? 7 : period === "30d" ? 30 : 90;
}

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");
  const [topArticles, setTopArticles] = useState<Article[]>([]);
  const [top100Articles, setTop100Articles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [userNewsList, setUserNewsList] = useState<UserNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [adPeriod, setAdPeriod] = useState<AdPeriod>("all");
  const [topCities, setTopCities] = useState<{ city: string; count: number }[]>([]);
  const [viewsByDay, setViewsByDay] = useState<{ date: string; views: number }[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
        p.catch((e) => { console.warn("[Analytics]", e?.message ?? e); return fallback; });

      const days = getDaysFromPeriod(timePeriod);
      const [top100, top5, cats, adsData, userNews, cities, viewsDay] =
        await Promise.all([
          safe(listArticles({ isPublished: true }, 100, 0), { articles: [], total: 0 }),
          safe(getMostViewedArticles(10), [] as Article[]),
          safe(listCategories(), [] as Category[]),
          safe(listAds(), [] as Ad[]),
          safe(listUserNews(), [] as UserNews[]),
          safe(getTopCities(20), [] as { city: string; count: number }[]),
          safe(getViewsByDay(days), [] as { date: string; views: number }[]),
        ]);

      if (!cancelled) {
        setTopArticles(top5);
        setTop100Articles(top100.articles);
        setCategories(cats);
        setAds(adsData);
        setUserNewsList(userNews);
        setTopCities(cities);
        setViewsByDay(viewsDay);
        setLoading(false);
      }
    }

    fetchData().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [timePeriod]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const now = new Date();
  const weekAgo = getDateDaysAgo(7);
  const monthAgo = getDateDaysAgo(30);

  const filteredAds = ads.filter((ad) => {
    if (adPeriod === "all") return true;
    const cutoff = adPeriod === "week" ? weekAgo : monthAgo;
    return new Date(ad.endsAt) >= cutoff;
  });

  // Charts data
  const topViewsChartData = topArticles
    .filter((a) => a.views > 0)
    .map((a) => ({ name: truncate(a.title, 30), views: a.views }));

  const catViewsData = Object.entries(
    top100Articles.reduce((acc, a) => {
      const cat = categoryMap.get(a.categoryId);
      if (cat) acc[cat.name] = (acc[cat.name] || 0) + a.views;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, views]) => ({ name, views }))
    .sort((a, b) => b.views - a.views);


  // Map data for cities
  const cityMapPoints: MapPoint[] = topCities
    .map((city) => {
      const coords = resolveCityCoords(city.city);
      if (!coords) return null;
      return { label: city.city, lat: coords[0], lng: coords[1], count: city.count };
    })
    .filter((p): p is MapPoint => p !== null);

  // Map data for neighborhoods (from user news)
  const locationCounts = userNewsList.reduce((acc, u) => {
    if (u.location) {
      acc[u.location] = (acc[u.location] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const neighborhoodMapPoints: MapPoint[] = Object.entries(locationCounts)
    .map(([location, count]) => {
      const coords = resolveLocationCoords(location);
      if (!coords) return null;
      return { label: location, lat: coords[0], lng: coords[1], count };
    })
    .filter((p): p is MapPoint => p !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Análises</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visualizações e métricas detalhadas</p>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {(["7d", "30d", "90d"] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setTimePeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timePeriod === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
            </button>
          ))}
        </div>
      </div>

      {/* Views over time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Acessos — últimos {getDaysFromPeriod(timePeriod)} dias
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? <Skeleton className="h-64 w-full rounded-lg" /> : viewsByDay.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Sem dados de acessos.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={viewsByDay} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(viewsByDay.length / 8))} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [v, "Acessos"]} />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#viewsGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Charts Row 1 — Top articles + Category views */}
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
              <p className="text-sm text-muted-foreground py-12 text-center">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
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
              <p className="text-sm text-muted-foreground py-12 text-center">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={catViewsData} dataKey="views" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={2} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {catViewsData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [(Number(v)).toLocaleString("pt-BR"), "Views"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category heatmap */}
      {!loading && categories.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Distribuição de artigos por categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maps */}
      <div className="grid gap-6 lg:grid-cols-2">
        {cityMapPoints.length > 0 && (
          <MapChart points={cityMapPoints} title="Acessos por cidade" zoom={5} />
        )}
        {neighborhoodMapPoints.length > 0 && (
          <MapChart points={neighborhoodMapPoints} title="Notícias por bairro" center={[-22.2822, -42.5311]} zoom={11} />
        )}
      </div>

      {/* Ads performance with period filter */}
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
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum anúncio.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Impressões</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cliques</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">CTR</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map((ad) => {
                    const adCtr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
                    const isRunning = ad.isActive && new Date(ad.startsAt) <= now && new Date(ad.endsAt) >= now;
                    return (
                      <tr key={ad.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium line-clamp-1">{ad.title}</td>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
