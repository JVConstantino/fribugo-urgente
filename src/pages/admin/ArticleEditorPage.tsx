import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";

import {
  getArticleById,
  createArticle,
  updateArticle,
  listCategories,
  uploadFile,
  getFileView,
  deleteFile,
} from "@/services/appwrite";
import type { Category } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  SLUG_PATTERN,
} from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

export default function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Cover image
  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Meta
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleContentChange = useCallback((html: string) => {
    setContent(html);
  }, []);

  // Load categories
  useEffect(() => {
    listCategories()
      .then((cats) => {
        setCategories(cats);
        if (!isEditing && cats.length > 0) {
          setCategoryId(cats[0].id);
        }
      })
      .catch(() => {});
  }, [isEditing]);

  // Load existing article if editing
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const article = await getArticleById(id!);
        if (cancelled) return;

        setTitle(article.title);
        setSlug(article.slug);
        setExcerpt(article.excerpt);
        setContent(article.content || "");
        setCategoryId(article.categoryId);
        setIsBreaking(article.isBreaking);
        setIsPublished(article.isPublished);
        setPublishedAt(
          article.publishedAt
            ? article.publishedAt.slice(0, 16)
            : new Date().toISOString().slice(0, 16)
        );
        setTags(article.tags || []);
        setCoverImageId(article.coverImageId);
        if (article.coverImageId) {
          setCoverPreviewUrl(getFileView(article.coverImageId));
        }
        setSlugManuallyEdited(true);
      } catch {
        toast({ title: "Erro ao carregar artigo", variant: "destructive" });
        navigate("/admin/artigos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(value);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use JPEG, PNG, WebP ou GIF.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 5 MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingCover(true);
    try {
      if (coverImageId) {
        await deleteFile(coverImageId).catch(() => {});
      }
      const uploaded = await uploadFile(file);
      setCoverImageId(uploaded.$id);
      setCoverPreviewUrl(getFileView(uploaded.$id));
    } catch {
      toast({ title: "Erro ao enviar imagem", variant: "destructive" });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function handleRemoveCover() {
    if (!coverImageId) return;
    await deleteFile(coverImageId).catch(() => {});
    setCoverImageId(null);
    setCoverPreviewUrl(null);
  }

  function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        setTags((prev) => [...prev, tag]);
      }
      setTagInput("");
    }
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function validateForm(): string | null {
    if (!title.trim()) return "O título é obrigatório.";
    if (!slug.trim()) return "O slug é obrigatório.";
    if (!SLUG_PATTERN.test(slug))
      return "O slug deve conter apenas letras minúsculas, números e hifens.";
    if (!categoryId) return "Selecione uma categoria.";
    if (!content || content === "<p></p>" || content === "<p><br></p>")
      return "O conteúdo é obrigatório.";
    return null;
  }

  async function handleSave(publish?: boolean) {
    const error = validateForm();
    if (error) {
      toast({ title: error, variant: "destructive" });
      return;
    }

    const shouldPublish = publish !== undefined ? publish : isPublished;

    setSaving(true);
    try {
      if (isEditing && id) {
        await updateArticle(id, {
          title: title.trim(),
          slug: slug.trim(),
          content,
          excerpt: excerpt.trim(),
          coverImageId,
          categoryId,
          isBreaking,
          isPublished: shouldPublish,
          publishedAt: new Date(publishedAt).toISOString(),
          tags,
        });
        setIsPublished(shouldPublish);
        toast({ title: "Artigo atualizado!" });
      } else {
        const created = await createArticle({
          title: title.trim(),
          slug: slug.trim(),
          content,
          excerpt: excerpt.trim(),
          coverImageId,
          categoryId,
          authorId: user?.id ?? "",
          isBreaking,
          isPublished: shouldPublish,
          publishedAt: new Date(publishedAt).toISOString(),
          tags,
        });
        toast({ title: "Artigo criado!" });
        navigate(`/admin/artigos/${created.id}/editar`, { replace: true });
      }
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o artigo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/artigos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Editar artigo" : "Novo artigo"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar rascunho
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPublished ? "Atualizar" : "Publicar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Título *</label>
                <Input
                  placeholder="Título da notícia"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-lg font-semibold"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Slug *</label>
                <Input
                  placeholder="titulo-da-noticia"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  URL: /noticias/<strong>{slug || "..."}</strong>
                </p>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Resumo</label>
                <Textarea
                  placeholder="Breve descrição da notícia (aparece nos cards e no SEO)"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Rich Text Editor */}
          <Card>
            <CardContent className="p-0">
              <RichTextEditor
                value={content}
                onChange={handleContentChange}
                placeholder="Escreva o conteúdo da notícia..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Publicação</h3>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data de publicação</label>
                <Input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Notícia urgente</label>
                <button
                  type="button"
                  onClick={() => setIsBreaking((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isBreaking ? "bg-destructive" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      isBreaking ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Publicado</label>
                <button
                  type="button"
                  onClick={() => setIsPublished((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPublished ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      isPublished ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold">Categoria *</h3>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma categoria cadastrada.
                </p>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </CardContent>
          </Card>

          {/* Cover image */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Imagem de capa</h3>

              {coverPreviewUrl ? (
                <div className="relative">
                  <img
                    src={coverPreviewUrl}
                    alt="Capa"
                    className="w-full rounded-md object-cover max-h-48"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {uploadingCover ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8" />
                      <span className="text-sm">Clique para enviar</span>
                      <span className="text-xs">JPEG, PNG, WebP ou GIF — máx. 5 MB</span>
                    </>
                  )}
                </button>
              )}

              {!coverPreviewUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                >
                  <Upload className="h-4 w-4" />
                  {uploadingCover ? "Enviando..." : "Enviar imagem"}
                </Button>
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={handleCoverUpload}
              />
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Tags</h3>
              <Input
                placeholder="Adicionar tag (Enter ou vírgula)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer gap-1 pr-1"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
