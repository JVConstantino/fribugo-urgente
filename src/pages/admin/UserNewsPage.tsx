import { useEffect, useState } from "react";
import {
  Inbox,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  MapPin,
  FileText,
  User,
  Phone,
  Mail,
  Clock,
  Brain,
  ImageIcon,
} from "lucide-react";
import {
  listUserNews,
  updateUserNews,
  deleteUserNews,
  getUserMediaView,
  listCategories,
} from "@/services/supabase";
import type { UserNews, UserNewsStatus, Category } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatRelativeDate } from "@/lib/utils";

const STATUS_LABELS: Record<UserNewsStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  processing: { label: "Processando", variant: "outline" },
  processed: { label: "Analisado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

export default function UserNewsPage() {
  const [items, setItems] = useState<UserNews[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<UserNewsStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<UserNews | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<UserNews | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [newsData, catsData] = await Promise.all([
        listUserNews(),
        listCategories().catch(() => []),
      ]);
      setItems(newsData);
      setCategories(catsData);
    } catch {
      toast({ title: "Erro ao carregar notícias", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const filteredItems = items.filter((item) => {
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    processed: items.filter((i) => i.status === "processed").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  };

  function openDetail(item: UserNews) {
    setSelectedItem(item);
    setAdminNotes(item.adminNotes || "");
    setDetailOpen(true);
  }

  async function handleStatusChange(id: string, status: UserNewsStatus) {
    try {
      const updated = await updateUserNews(id, { status });
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      if (selectedItem?.id === id) setSelectedItem(updated);
      toast({ title: `Status alterado para "${STATUS_LABELS[status].label}".` });
    } catch {
      toast({ title: "Erro ao alterar status", variant: "destructive" });
    }
  }

  async function handleSaveNotes() {
    if (!selectedItem) return;
    try {
      const updated = await updateUserNews(selectedItem.id, { adminNotes });
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setSelectedItem(updated);
      toast({ title: "Notas salvas." });
    } catch {
      toast({ title: "Erro ao salvar notas", variant: "destructive" });
    }
  }

  function openDelete(item: UserNews) {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await deleteUserNews(deletingItem.id);
      setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
      toast({ title: "Notícia excluída." });
      setDeleteDialogOpen(false);
      if (detailOpen && selectedItem?.id === deletingItem.id) setDetailOpen(false);
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notícias de Internautas</h1>
        <p className="text-sm text-muted-foreground">
          Notícias e denúncias enviadas pela comunidade
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Inbox className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Brain className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Analisados</p>
              <p className="text-xl font-bold text-emerald-600">{stats.processed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Rejeitados</p>
              <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou autor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as UserNewsStatus | "all")}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="processing">Processando</option>
          <option value="processed">Analisados</option>
          <option value="rejected">Rejeitados</option>
        </select>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                {items.length === 0
                  ? "Nenhuma notícia recebida ainda."
                  : "Nenhum resultado com os filtros aplicados."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredItems.map((item) => {
                const statusInfo = STATUS_LABELS[item.status];
                const cat = item.categoryId ? categoryMap.get(item.categoryId) : null;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => openDetail(item)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                        {cat && (
                          <Badge variant="outline" className="text-xs" style={{ borderColor: cat.color, color: cat.color }}>
                            {cat.name}
                          </Badge>
                        )}
                        {item.mediaIds.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {item.mediaIds.length} mídia(s)
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.authorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeDate(item.createdAt)}
                        </span>
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </span>
                        )}
                      </div>
                      {item.aiSummary && (
                        <p className="text-xs text-primary mt-1.5 flex items-start gap-1.5">
                          <Brain className="h-3 w-3 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.aiSummary}</span>
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" title="Ver detalhes">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8">{selectedItem.title}</DialogTitle>
                <DialogDescription>
                  Enviado por {selectedItem.authorName} · {formatRelativeDate(selectedItem.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Status + Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={STATUS_LABELS[selectedItem.status].variant}>
                    {STATUS_LABELS[selectedItem.status].label}
                  </Badge>
                  {selectedItem.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(selectedItem.id, "processing")}>
                        <Loader2 className="h-3.5 w-3.5" />
                        Marcar processando
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(selectedItem.id, "processed")}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Marcar analisado
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleStatusChange(selectedItem.id, "rejected")}>
                        <XCircle className="h-3.5 w-3.5" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                </div>

                <Separator />

                {/* Dados do fato */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" /> O que ocorreu
                    </p>
                    <p className="text-sm">{selectedItem.whatHappened}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Onde ocorreu
                    </p>
                    <p className="text-sm">{selectedItem.location}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Descrição completa</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedItem.description}</p>
                </div>

                {/* Mídia */}
                {selectedItem.mediaIds.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Mídia ({selectedItem.mediaIds.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedItem.mediaIds.map((mediaId) => (
                        <a
                          key={mediaId}
                          href={getUserMediaView(mediaId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-md overflow-hidden border border-border hover:ring-2 hover:ring-primary transition-all"
                        >
                          <img
                            src={getUserMediaView(mediaId)}
                            alt="Mídia"
                            className="h-24 w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                const div = document.createElement("div");
                                div.className = "flex items-center justify-center h-24 bg-muted";
                                div.innerHTML = '<svg class="h-6 w-6 text-muted-foreground"></svg>';
                                parent.appendChild(div);
                              }
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dados do autor */}
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedItem.authorName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedItem.authorPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedItem.authorEmail}</span>
                  </div>
                </div>

                {/* AI Analysis */}
                {selectedItem.aiSummary && (
                  <>
                    <Separator />
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-medium text-primary mb-2 flex items-center gap-1.5">
                        <Brain className="h-4 w-4" />
                        Análise por IA
                      </p>
                      {selectedItem.aiCategory && (
                        <p className="text-xs mb-2">
                          <span className="text-muted-foreground">Categoria sugerida:</span>{" "}
                          <Badge variant="outline">{selectedItem.aiCategory}</Badge>
                        </p>
                      )}
                      <p className="text-sm mb-2">{selectedItem.aiSummary}</p>
                      {selectedItem.aiAnalysis && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedItem.aiAnalysis}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Admin Notes */}
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Notas do admin</p>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Adicione notas sobre esta notícia..."
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                  />
                  <Button size="sm" variant="outline" className="mt-2" onClick={handleSaveNotes}>
                    Salvar notas
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" className="text-destructive" onClick={() => openDelete(selectedItem)}>
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir notícia</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deletingItem?.title}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
