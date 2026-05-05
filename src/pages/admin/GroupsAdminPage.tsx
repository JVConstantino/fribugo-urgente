import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Loader2,
  Upload,
  X,
  MessageCircle,
  ToggleLeft,
  ToggleRight,
  GripVertical,
} from "lucide-react";
import {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  uploadFile,
  getFileView,
  deleteFile,
} from "@/services/supabase";
import type {
  WhatsAppGroup,
  CreateWhatsAppGroupData,
  UpdateWhatsAppGroupData,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

// ===== Form =====

interface GroupFormData {
  title: string;
  description: string;
  link: string;
  category: string;
  imageId: string | null;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm = (): GroupFormData => ({
  title: "",
  description: "",
  link: "",
  category: "",
  imageId: null,
  isActive: true,
  sortOrder: 0,
});

// ===== Main =====

export default function GroupsAdminPage() {
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WhatsAppGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<WhatsAppGroup | null>(null);
  const [form, setForm] = useState<GroupFormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listGroups()
      .then(setGroups)
      .catch(() => toast({ title: "Erro ao carregar grupos", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditingGroup(null);
    setForm(emptyForm());
    setImagePreviewUrl(null);
    setDialogOpen(true);
  }

  function openEdit(group: WhatsAppGroup) {
    setEditingGroup(group);
    setForm({
      title: group.title,
      description: group.description,
      link: group.link,
      category: group.category,
      imageId: group.imageId,
      isActive: group.isActive,
      sortOrder: group.sortOrder,
    });
    setImagePreviewUrl(group.imageId ? getFileView(group.imageId) : null);
    setDialogOpen(true);
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
      if (form.imageId) await deleteFile(form.imageId).catch(() => {});
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

  function validateForm(): string | null {
    if (!form.title.trim()) return "O título é obrigatório.";
    if (!form.link.trim()) return "O link do grupo é obrigatório.";
    if (!form.link.startsWith("https://chat.whatsapp.com/") && !form.link.startsWith("https://"))
      return "Insira um link de convite válido do WhatsApp.";
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
        description: form.description.trim(),
        link: form.link.trim(),
        category: form.category.trim(),
        imageId: form.imageId,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };
      if (editingGroup) {
        const updated = await updateGroup(editingGroup.id, payload as UpdateWhatsAppGroupData);
        setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        toast({ title: "Grupo atualizado!" });
      } else {
        const created = await createGroup(payload as CreateWhatsAppGroupData);
        setGroups((prev) => [...prev, created]);
        toast({ title: "Grupo criado!" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Erro ao salvar grupo", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingGroup) return;
    setDeleting(true);
    try {
      await deleteGroup(deletingGroup.id);
      if (deletingGroup.imageId) await deleteFile(deletingGroup.imageId).catch(() => {});
      setGroups((prev) => prev.filter((g) => g.id !== deletingGroup.id));
      toast({ title: "Grupo excluído." });
      setDeleteDialogOpen(false);
    } catch {
      toast({ title: "Erro ao excluir grupo", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grupos de WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os links dos grupos exibidos no portal
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo grupo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Todos os grupos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum grupo cadastrado.</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Criar primeiro grupo
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  {group.imageId ? (
                    <img
                      src={getFileView(group.imageId)}
                      alt={group.title}
                      className="h-10 w-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{group.title}</span>
                      {group.category && (
                        <Badge variant="secondary" className="text-xs">
                          {group.category}
                        </Badge>
                      )}
                      <Badge
                        variant={group.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {group.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {group.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(group)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeletingGroup(group);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Editar grupo" : "Novo grupo"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do grupo de WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome do grupo *</label>
              <Input
                placeholder="Ex: Notícias Nova Friburgo"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Link de convite *</label>
              <Input
                type="url"
                placeholder="https://chat.whatsapp.com/..."
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Breve descrição do grupo..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoria</label>
              <Input
                placeholder="Ex: Notícias, Esportes, Entretenimento..."
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Ordem de exibição</label>
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
                }
              />
            </div>

            {/* Image */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Ícone do grupo</label>
              {imagePreviewUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={imagePreviewUrl}
                    alt="Ícone"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      if (form.imageId) deleteFile(form.imageId).catch(() => {});
                      setForm((f) => ({ ...f, imageId: null }));
                      setImagePreviewUrl(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                    Remover
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border py-4 text-muted-foreground transition-colors hover:border-primary hover:text-primary text-sm"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Enviar ícone
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

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Grupo ativo</label>
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
              {editingGroup ? "Salvar alterações" : "Criar grupo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir grupo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o grupo{" "}
              <strong>{deletingGroup?.title}</strong>?
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
