import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Loader2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  listArticles,
  listCategories,
  deleteArticle,
} from "@/services/appwrite";
import type { Article, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { formatDate, truncate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const fetchArticles = useCallback(
    async (
      pageNum: number,
      search: string,
      status: "all" | "published" | "draft",
      append: boolean
    ) => {
      const offset = pageNum * ITEMS_PER_PAGE;
      const filters: { isPublished?: boolean; search?: string } = {};
      if (status === "published") filters.isPublished = true;
      if (status === "draft") filters.isPublished = false;
      if (search.trim()) filters.search = search.trim();

      try {
        const result = await listArticles(
          Object.keys(filters).length > 0 ? filters : undefined,
          ITEMS_PER_PAGE,
          offset
        );
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
      try {
        const cats = await listCategories();
        if (!cancelled) setCategories(cats);
      } catch {
        // ignore
      }

      setLoading(true);
      await fetchArticles(0, searchQuery, filterStatus, false);
      if (!cancelled) setLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [fetchArticles, searchQuery, filterStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setLoading(true);
    fetchArticles(0, searchQuery, filterStatus, false).finally(() =>
      setLoading(false)
    );
  };

  const handleFilterChange = (status: "all" | "published" | "draft") => {
    setFilterStatus(status);
    setPage(0);
    setLoading(true);
    fetchArticles(0, searchQuery, status, false).finally(() =>
      setLoading(false)
    );
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    await fetchArticles(nextPage, searchQuery, filterStatus, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteArticle(deleteTarget.id);
      toast({ title: "Artigo excluido com sucesso!" });
      setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setTotal((prev) => prev - 1);
      setDeleteTarget(null);
    } catch {
      toast({
        title: "Erro ao excluir",
        description: "Nao foi possivel excluir o artigo.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const hasMore = articles.length < total;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Artigos</h1>
        <Button asChild>
          <Link to="/admin/artigos/novo">
            <Plus className="h-4 w-4" />
            Novo artigo
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline" size="default">
                Buscar
              </Button>
            </form>
            <div className="flex items-center gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("all")}
              >
                Todos
              </Button>
              <Button
                variant={filterStatus === "published" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("published")}
              >
                Publicados
              </Button>
              <Button
                variant={filterStatus === "draft" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("draft")}
              >
                Rascunhos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {total} artigo{total !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum artigo encontrado.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Titulo</th>
                      <th className="pb-3 font-medium">Categoria</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Data</th>
                      <th className="pb-3 font-medium">Visualizacoes</th>
                      <th className="pb-3 font-medium text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article) => {
                      const cat = categoryMap.get(article.categoryId);
                      return (
                        <tr key={article.id} className="border-b last:border-0">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              {article.isBreaking && (
                                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                              )}
                              <span className="font-medium text-sm line-clamp-1">
                                {truncate(article.title, 50)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            {cat ? (
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{ borderColor: cat.color, color: cat.color }}
                              >
                                {cat.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant={article.isPublished ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {article.isPublished ? "Publicado" : "Rascunho"}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-sm text-muted-foreground">
                            {formatDate(article.publishedAt || article.createdAt)}
                          </td>
                          <td className="py-3 pr-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {article.views}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/admin/artigos/${article.id}/editar`}>
                                  <Edit3 className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget(article)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {articles.map((article) => {
                  const cat = categoryMap.get(article.categoryId);
                  return (
                    <div
                      key={article.id}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2 flex-wrap">
                          {article.isBreaking && (
                            <Badge variant="destructive" className="text-xs">
                              Urgente
                            </Badge>
                          )}
                          <Badge
                            variant={article.isPublished ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {article.isPublished ? "Publicado" : "Rascunho"}
                          </Badge>
                          {cat && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: cat.color, color: cat.color }}
                            >
                              {cat.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium line-clamp-1">
                          {article.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(article.publishedAt || article.createdAt)} -{" "}
                          <span className="flex items-center gap-0.5 inline-flex">
                            <Eye className="h-3 w-3" />
                            {article.views}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/artigos/${article.id}/editar`}>
                            <Edit3 className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(article)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      "Carregar mais"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir artigo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o artigo &quot;{deleteTarget?.title}&quot;?
              Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
