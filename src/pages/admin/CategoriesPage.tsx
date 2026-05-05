import { useEffect, useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Loader2,
  FolderOpen,
  GripVertical,
} from "lucide-react";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/supabase";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { DEFAULT_CATEGORY_COLORS, SLUG_PATTERN } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface CategoryFormData {
  name: string;
  slug: string;
  color: string;
  icon: string;
  sortOrder: number;
}

const emptyForm = (): CategoryFormData => ({
  name: "",
  slug: "",
  color: DEFAULT_CATEGORY_COLORS[0],
  icon: "",
  sortOrder: 0,
});

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const cats = await listCategories();
      setCategories(cats);
    } catch {
      toast({ title: "Erro ao carregar categorias", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingCategory(null);
    setForm({ ...emptyForm(), sortOrder: categories.length });
    setSlugManuallyEdited(false);
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      color: cat.color,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
    });
    setSlugManuallyEdited(true);
    setDialogOpen(true);
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugManuallyEdited ? prev.slug : slugify(value),
    }));
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setForm((prev) => ({ ...prev, slug: value }));
  }

  function validateForm(): string | null {
    if (!form.name.trim()) return "O nome é obrigatório.";
    if (!form.slug.trim()) return "O slug é obrigatório.";
    if (!SLUG_PATTERN.test(form.slug)) {
      return "O slug deve conter apenas letras minúsculas, números e hifens.";
    }
    const duplicate = categories.find(
      (c) => c.slug === form.slug && c.id !== editingCategory?.id
    );
    if (duplicate) return "Já existe uma categoria com esse slug.";
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
      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          color: form.color,
          icon: form.icon.trim(),
          sortOrder: form.sortOrder,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        toast({ title: "Categoria atualizada!" });
      } else {
        const created = await createCategory({
          name: form.name.trim(),
          slug: form.slug.trim(),
          color: form.color,
          icon: form.icon.trim(),
          sortOrder: form.sortOrder,
        });
        setCategories((prev) => [...prev, created]);
        toast({ title: "Categoria criada!" });
      }
      setDialogOpen(false);
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a categoria.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast({ title: "Categoria excluída!" });
      setDeleteTarget(null);
    } catch {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a categoria.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {categories.length} categoria{categories.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center">
              <FolderOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Nenhuma categoria cadastrada.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{cat.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        /{cat.slug}
                      </span>
                      {cat.icon && (
                        <span className="ml-2 text-base">{cat.icon}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      #{cat.sortOrder}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(cat)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(cat)}
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
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar categoria" : "Nova categoria"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? "Atualize as informações da categoria." : "Crie uma nova categoria para organizar as notícias."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                placeholder="Ex: Política"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={saving}
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Slug *</label>
              <Input
                placeholder="ex: politica"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Usado na URL: /categoria/<strong>{form.slug || "..."}</strong>
              </p>
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, color }))}
                    className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        form.color === color ? "#000" : "transparent",
                    }}
                    aria-label={color}
                  />
                ))}
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="h-8 w-8 cursor-pointer rounded border p-0.5"
                  title="Cor personalizada"
                />
              </div>
            </div>

            {/* Icon */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Ícone (emoji)</label>
              <EmojiPicker
                value={form.icon}
                onChange={(emoji) =>
                  setForm((prev) => ({ ...prev, icon: emoji }))
                }
                disabled={saving}
                categorySlug={form.slug}
              />
            </div>

            {/* Sort order */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Ordem</label>
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: parseInt(e.target.value) || 0,
                  }))
                }
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : editingCategory ? (
                "Salvar alterações"
              ) : (
                "Criar categoria"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a categoria &quot;
              {deleteTarget?.name}&quot;? Artigos nessa categoria não serão
              excluídos, mas perderão a referência à categoria.
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
