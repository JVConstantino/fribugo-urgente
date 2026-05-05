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
  Eye,
  MousePointerClick,
  Search,
} from "lucide-react";
import {
  listPopups,
  createPopup,
  updatePopup,
  deletePopup,
  uploadFile,
  getFileView,
  deleteFile,
  listGroups,
} from "@/services/appwrite";
import type { Popup, CreatePopupData, UpdatePopupData, PopupType, WhatsAppGroup } from "@/types";
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
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";

function toLocalDateTimeInput(isoString: string): string {
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

interface PopupFormData {
  title: string;
  type: PopupType;
  imageId: string | null;
  linkUrl: string | null;
  groupId: string | null;
  heading: string | null;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const emptyForm = (): PopupFormData => ({
  title: "",
  type: "image",
  imageId: null,
  linkUrl: null,
  groupId: null,
  heading: null,
  description: null,
  startsAt: toLocalDateTimeInput(new Date().toISOString()),
  endsAt: toLocalDateTimeInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
  isActive: true,
});

function isPopupRunning(popup: Popup): boolean {
  const now = new Date();
  return (
    popup.isActive &&
    new Date(popup.startsAt) <= now &&
    new Date(popup.endsAt) >= now
  );
}

export default function PopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [deletingPopup, setDeletingPopup] = useState<Popup | null>(null);
  const [form, setForm] = useState<PopupFormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);

  useEffect(() => {
    fetchPopups();
    fetchGroups();
  }, []);

  async function fetchPopups() {
    try {
      const data = await listPopups();
      setPopups(data);
    } catch {
      toast({ title: "Erro ao carregar popups", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchGroups() {
    try {
      const data = await listGroups(true);
      setGroups(data);
    } catch {
      // ignore
    }
  }

  const filteredPopups = popups.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function openCreate() {
    setEditingPopup(null);
    setForm(emptyForm());
    setImagePreviewUrl(null);
    setDialogOpen(true);
  }

  function openEdit(popup: Popup) {
    setEditingPopup(popup);
    setForm({
      title: popup.title,
      type: popup.type,
      imageId: popup.imageId,
      linkUrl: popup.linkUrl,
      groupId: popup.groupId,
      heading: popup.heading,
      description: popup.description,
      startsAt: toLocalDateTimeInput(popup.startsAt),
      endsAt: toLocalDateTimeInput(popup.endsAt),
      isActive: popup.isActive,
    });
    if (popup.imageId) {
      try {
        const url = getFileView(popup.imageId);
        setImagePreviewUrl(typeof url === "string" ? url : (url as { href: string }).href);
      } catch {
        setImagePreviewUrl(null);
      }
    } else {
      setImagePreviewUrl(null);
    }
    setDialogOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: "Formato de imagem inválido", variant: "destructive" });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Imagem muito grande (máx. 5MB)", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      if (form.imageId) {
        await deleteFile(form.imageId).catch(() => {});
      }
      const uploaded = await uploadFile(file);
      setForm((f) => ({ ...f, imageId: uploaded.$id }));
      const url = getFileView(uploaded.$id);
      setImagePreviewUrl(typeof url === "string" ? url : (url as { href: string }).href);
      toast({ title: "Imagem enviada com sucesso" });
    } catch {
      toast({ title: "Erro ao enviar imagem", variant: "destructive" });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  function handleRemoveImage() {
    if (form.imageId) {
      deleteFile(form.imageId).catch(() => {});
    }
    setForm((f) => ({ ...f, imageId: null }));
    setImagePreviewUrl(null);
  }

  function validateForm(): string | null {
    if (!form.title.trim()) return "Título é obrigatório";
    const startDate = new Date(form.startsAt);
    const endDate = new Date(form.endsAt);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
      return "Datas inválidas";
    if (endDate <= startDate) return "Data de fim deve ser após a de início";
    if (form.type === "image") {
      if (!form.linkUrl?.trim()) return "URL de destino é obrigatória para popups de imagem";
    } else if (form.type === "group") {
      if (!form.groupId) return "Selecione um grupo de WhatsApp";
    }
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
      const payload: CreatePopupData = {
        title: form.title.trim(),
        type: form.type,
        imageId: form.imageId,
        linkUrl: form.linkUrl ? form.linkUrl.trim() : null,
        groupId: form.groupId,
        heading: form.heading ? form.heading.trim() : null,
        description: form.description ? form.description.trim() : null,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        isActive: form.isActive,
      };

      if (editingPopup) {
        const updated = await updatePopup(editingPopup.id, payload);
        setPopups((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        toast({ title: "Popup atualizado com sucesso" });
      } else {
        const created = await createPopup(payload);
        setPopups((prev) => [created, ...prev]);
        toast({ title: "Popup criado com sucesso" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Erro ao salvar popup", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function openDelete(popup: Popup) {
    setDeletingPopup(popup);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingPopup) return;
    setDeleting(true);
    try {
      if (deletingPopup.imageId) {
        await deleteFile(deletingPopup.imageId).catch(() => {});
      }
      await deletePopup(deletingPopup.id);
      setPopups((prev) => prev.filter((p) => p.id !== deletingPopup.id));
      toast({ title: "Popup excluído com sucesso" });
      setDeleteDialogOpen(false);
    } catch {
      toast({ title: "Erro ao excluir popup", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Popups</h2>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Popups</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo popup
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredPopups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Nenhum popup encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPopups.map((popup) => (
            <Card key={popup.id} className="hover:shadow-md transition">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  {popup.imageId && (
                    <img
                      src={getFileView(popup.imageId)}
                      alt={popup.title}
                      className="h-16 w-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{popup.title}</h3>
                      <Badge variant={isPopupRunning(popup) ? "default" : "secondary"}>
                        {isPopupRunning(popup) ? "No ar" : popup.isActive ? "Agendado" : "Inativo"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {popup.type === "image" ? "Imagem" : "Grupo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(popup.startsAt).toLocaleDateString("pt-BR")} a{" "}
                      {new Date(popup.endsAt).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {popup.impressions} exibições
                      </div>
                      <div className="flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" />
                        {popup.clicks} cliques
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(popup)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDelete(popup)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPopup ? "Editar popup" : "Novo popup"}
            </DialogTitle>
            <DialogDescription>
              Configure um popup para aparecer na home do site
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título (interno) *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Banner de promoção"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo *</label>
                <select
                  value={form.type}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      type: e.target.value as PopupType,
                      imageId: null,
                      linkUrl: null,
                      groupId: null,
                    });
                    setImagePreviewUrl(null);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="image">Imagem</option>
                  <option value="group">Grupo WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Ativo</label>
                <button
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className="w-full flex items-center justify-center"
                >
                  {form.isActive ? (
                    <ToggleRight className="h-6 w-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {form.type === "image" && (
              <>
                <div>
                  <label className="text-sm font-medium">Imagem</label>
                  {imagePreviewUrl ? (
                    <div className="relative">
                      <img src={imagePreviewUrl} alt="preview" className="w-full h-40 object-cover rounded" />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border py-8 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          <span className="text-sm">Clique para enviar imagem</span>
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

                <div>
                  <label className="text-sm font-medium">URL de destino *</label>
                  <Input
                    value={form.linkUrl || ""}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </>
            )}

            {form.type === "group" && (
              <div>
                <label className="text-sm font-medium">Grupo WhatsApp *</label>
                <select
                  value={form.groupId || ""}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value || null })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione um grupo</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Título visível</label>
              <Input
                value={form.heading || ""}
                onChange={(e) => setForm({ ...form, heading: e.target.value })}
                placeholder="Ex: Confira nossa promoção"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Texto adicional do popup..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Início *</label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Fim *</label>
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir popup?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita
            </DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground">
            Tem certeza que deseja excluir o popup{" "}
            <strong>{deletingPopup?.title}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
