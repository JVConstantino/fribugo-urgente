import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Loader2,
  Upload,
  X,
  ToggleLeft,
  ToggleRight,
  BarChart2,
  MousePointerClick,
  Eye,
} from "lucide-react";
import {
  listAds,
  createAd,
  updateAd,
  deleteAd,
  uploadFile,
  getFileView,
  deleteFile,
} from "@/services/appwrite";
import type { Ad, CreateAdData, UpdateAdData, AdFormat, AdPage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from "@/lib/constants";
import { toast } from "@/hooks/use-toast";

// ===== Constants =====

const FORMAT_LABELS: Record<AdFormat, string> = {
  leaderboard: "Leaderboard (728×90)",
  banner: "Banner (468×60)",
  sidebar: "Sidebar (300×250)",
  square: "Quadrado (250×250)",
};

const PAGE_LABELS: Record<AdPage, string> = {
  home: "Home",
  article: "Artigo",
  category: "Categoria",
  all: "Todas",
};

const ALL_PAGES: AdPage[] = ["home", "article", "category", "all"];
const ALL_FORMATS: AdFormat[] = ["leaderboard", "banner", "sidebar", "square"];

// ===== Helpers =====

/** Convert a UTC ISO string from Appwrite to a datetime-local input value (local time) */
function toLocalDateTimeInput(isoString: string): string {
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

// ===== Ad Form Interface =====

interface AdFormData {
  title: string;
  imageId: string | null;
  linkUrl: string;
  format: AdFormat;
  pages: AdPage[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const emptyForm = (): AdFormData => ({
  title: "",
  imageId: null,
  linkUrl: "",
  format: "banner",
  pages: ["home"],
  startsAt: toLocalDateTimeInput(new Date().toISOString()),
  endsAt: toLocalDateTimeInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
  isActive: true,
});

// ===== Helper =====

function isAdRunning(ad: Ad): boolean {
  const now = new Date();
  return (
    ad.isActive &&
    new Date(ad.startsAt) <= now &&
    new Date(ad.endsAt) >= now
  );
}

// ===== Main Component =====

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [deletingAd, setDeletingAd] = useState<Ad | null>(null);
  const [form, setForm] = useState<AdFormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    try {
      const data = await listAds();
      setAds(data);
    } catch {
      toast({ title: "Erro ao carregar anúncios", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingAd(null);
    setForm(emptyForm());
    setImagePreviewUrl(null);
    setDialogOpen(true);
  }

  function openEdit(ad: Ad) {
    setEditingAd(ad);
    setForm({
      title: ad.title,
      imageId: ad.imageId,
      linkUrl: ad.linkUrl,
      format: ad.format,
      pages: ad.pages,
      startsAt: toLocalDateTimeInput(ad.startsAt),
      endsAt: toLocalDateTimeInput(ad.endsAt),
      isActive: ad.isActive,
    });
    setImagePreviewUrl(ad.imageId ? getFileView(ad.imageId) : null);
    setDialogOpen(true);
  }

  function openDelete(ad: Ad) {
    setDeletingAd(ad);
    setDeleteDialogOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: "Formato inválido. Use JPEG, PNG ou WebP.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Imagem muito grande (máx. 5 MB).", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      if (form.imageId) {
        await deleteFile(form.imageId).catch(() => {});
      }
      const uploaded = await uploadFile(file);
      setForm((f) => ({ ...f, imageId: uploaded.$id }));
      setImagePreviewUrl(getFileView(uploaded.$id));
    } catch {
      toast({ title: "Erro ao enviar imagem", variant: "destructive" });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  async function handleRemoveImage() {
    if (!form.imageId) return;
    await deleteFile(form.imageId).catch(() => {});
    setForm((f) => ({ ...f, imageId: null }));
    setImagePreviewUrl(null);
  }

  function togglePage(page: AdPage) {
    setForm((f) => ({
      ...f,
      pages: f.pages.includes(page)
        ? f.pages.filter((p) => p !== page)
        : [...f.pages, page],
    }));
  }

  function validateForm(): string | null {
    if (!form.title.trim()) return "O título é obrigatório.";
    if (!form.linkUrl.trim()) return "A URL de destino é obrigatória.";
    if (form.pages.length === 0) return "Selecione ao menos uma página.";
    if (!form.startsAt || !form.endsAt) return "Defina o período de veiculação.";
    if (new Date(form.endsAt) <= new Date(form.startsAt))
      return "A data de fim deve ser posterior à de início.";
    return null;
  }

  async function handleSave() {
    const error = validateForm();
    if (error) {
      toast({ title: error, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        imageId: form.imageId,
        linkUrl: form.linkUrl.trim(),
        format: form.format,
        pages: form.pages,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        isActive: form.isActive,
      };

      if (editingAd) {
        const updated = await updateAd(editingAd.id, payload as UpdateAdData);
        setAds((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        toast({ title: "Anúncio atualizado!" });
      } else {
        const created = await createAd(payload as CreateAdData);
        setAds((prev) => [created, ...prev]);
        toast({ title: "Anúncio criado!" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Erro ao salvar anúncio", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingAd) return;
    setDeleting(true);
    try {
      await deleteAd(deletingAd.id);
      if (deletingAd.imageId) {
        await deleteFile(deletingAd.imageId).catch(() => {});
      }
      setAds((prev) => prev.filter((a) => a.id !== deletingAd.id));
      toast({ title: "Anúncio excluído." });
      setDeleteDialogOpen(false);
    } catch {
      toast({ title: "Erro ao excluir anúncio", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Anúncios</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os anúncios exibidos no portal
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo anúncio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Todos os anúncios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : ads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart2 className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum anúncio cadastrado.</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Criar primeiro anúncio
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {ads.map((ad) => {
                const running = isAdRunning(ad);
                return (
                  <div
                    key={ad.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="shrink-0">
                      {ad.imageId ? (
                        <img
                          src={getFileView(ad.imageId)}
                          alt={ad.title}
                          className="h-14 w-20 rounded object-cover bg-muted"
                        />
                      ) : (
                        <div className="h-14 w-20 rounded bg-muted flex items-center justify-center">
                          <BarChart2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">{ad.title}</span>
                        <Badge
                          variant={running ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {running ? "No ar" : ad.isActive ? "Agendado" : "Inativo"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {FORMAT_LABELS[ad.format]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>
                          {ad.pages.map((p) => PAGE_LABELS[p]).join(", ")}
                        </span>
                        <span>
                          {new Date(ad.startsAt).toLocaleDateString("pt-BR")} →{" "}
                          {new Date(ad.endsAt).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {ad.impressions.toLocaleString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          {ad.clicks.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Editar"
                        onClick={() => openEdit(ad)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Excluir"
                        onClick={() => openDelete(ad)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAd ? "Editar anúncio" : "Novo anúncio"}
            </DialogTitle>
            <DialogDescription>
              Configure o anúncio e onde ele será exibido.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Título interno *</label>
              <Input
                placeholder="Ex: Banner Topo Março 2025"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Link URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">URL de destino *</label>
              <Input
                type="url"
                placeholder="https://exemplo.com"
                value={form.linkUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Imagem do anúncio</label>
              {imagePreviewUrl ? (
                <div className="relative">
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    className="w-full rounded-md object-cover max-h-32 bg-muted"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border py-6 text-muted-foreground transition-colors hover:border-primary hover:text-primary text-sm"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Enviar imagem
                    </>
                  )}
                </button>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* Format */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Formato</label>
              <select
                value={form.format}
                onChange={(e) => setForm((f) => ({ ...f, format: e.target.value as AdFormat }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {ALL_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {FORMAT_LABELS[fmt]}
                  </option>
                ))}
              </select>
            </div>

            {/* Pages */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Exibir nas páginas *</label>
              <div className="flex flex-wrap gap-2">
                {ALL_PAGES.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => togglePage(page)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      form.pages.includes(page)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {PAGE_LABELS[page]}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Início *</label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fim *</label>
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Anúncio ativo</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                className="text-primary"
              >
                {form.isActive ? (
                  <ToggleRight className="h-7 w-7" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingAd ? "Salvar alterações" : "Criar anúncio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir anúncio</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o anúncio{" "}
              <strong>{deletingAd?.title}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
