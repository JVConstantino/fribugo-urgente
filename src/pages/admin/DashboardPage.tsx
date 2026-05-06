import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  FolderOpen,
  Eye,
  Edit3,
  Plus,
  Clock,
  Zap,
  Trophy,
  Megaphone,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Inbox,
  AlertCircle,
  Settings,
  MessageCircle,
  MousePointerClick,
  LineChart,
  BarChart2,
  TrendingUp,
} from "lucide-react";
import {
  listArticles,
  listCategories,
  getMostViewedArticles,
  listAds,
  listNewsletterSubscribers,
  listUserNews,
} from "@/services/supabase";
import type { Article, Category, Ad, Newsletter, UserNews } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatRelativeDate } from "@/lib/utils";


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


export default function DashboardPage() {
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [topArticles, setTopArticles] = useState<Article[]>([]);
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

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
        p.catch((e) => { console.warn("[Dashboard]", e?.message ?? e); return fallback; });

      const [recent, published, drafts, breaking, top100, top5, cats, adsData, nl, userNews] =
        await Promise.all([
          safe(listArticles(undefined, 5, 0), { articles: [], total: 0 }),
          safe(listArticles({ isPublished: true }, 1, 0), { articles: [], total: 0 }),
          safe(listArticles({ isPublished: false }, 1, 0), { articles: [], total: 0 }),
          safe(listArticles({ isBreaking: true }, 1, 0), { articles: [], total: 0 }),
          safe(listArticles({ isPublished: true }, 100, 0), { articles: [], total: 0 }),
          safe(getMostViewedArticles(5), [] as Article[]),
          safe(listCategories(), [] as Category[]),
          safe(listAds(), [] as Ad[]),
          safe(listNewsletterSubscribers(), [] as Newsletter[]),
          safe(listUserNews(), [] as UserNews[]),
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
        setCategories(cats);
        setAds(adsData);
        setNewsletter(nl);
        setUserNewsList(userNews);
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

  const now = new Date();
  const activeAdsCount = ads.filter((a) => {
    return a.isActive && new Date(a.startsAt) <= now && new Date(a.endsAt) >= now;
  }).length;

  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral do portal</p>
        </div>
        <Button asChild variant="outline" className="text-sm">
          <Link to="/admin/analises">
            <LineChart className="h-4 w-4" />
            Ver análises completas
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

    </div>
  );
}
