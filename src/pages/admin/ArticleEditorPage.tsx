import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, X, Image, Send, Play, Film } from "lucide-react";

import {
  getArticleById,
  createArticle,
  updateArticle,
  listCategories,
  uploadFile,
  uploadArticleVideo,
  getFileView,
  getArticleVideoUrl,
  deleteFile,
  deleteArticleVideo,
  getSetting,
  triggerN8nWebhook,
} from "@/services/supabase";
import type { Category } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MAX_FILE_SIZE,
  MAX_ARTICLE_VIDEO_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  SLUG_PATTERN,
} from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { MediaGallery } from "@/components/admin/MediaGallery";

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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Article video
  const [videoFileId, setVideoFileId] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoThumbnailImageId, setVideoThumbnailImageId] = useState<string | null>(null);
  const [videoThumbnailPreviewUrl, setVideoThumbnailPreviewUrl] = useState<string | null>(null);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoCaption, setVideoCaption] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingVideoThumbnail, setUploadingVideoThumbnail] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoThumbnailInputRef = useRef<HTMLInputElement>(null);

  // N8N dispatch flags
  const [sendToWhatsapp, setSendToWhatsapp] = useState(false);
  const [sendToEmail, setSendToEmail] = useState(false);

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
        setVideoFileId(article.videoFileId);
        setVideoPreviewUrl(getArticleVideoUrl(article));
        setVideoThumbnailImageId(article.videoThumbnailImageId);
        setVideoThumbnailPreviewUrl(
          article.videoThumbnailImageId ? getFileView(article.videoThumbnailImageId) : null
        );
        setVideoDurationSeconds(article.videoDurationSeconds);
        setVideoEnabled(article.videoEnabled);
        setVideoCaption(article.videoCaption || "");
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

  function extractFirstVideoFrame(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        video.removeAttribute("src");
        video.load();
      };

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onerror = () => {
        cleanup();
        reject(new Error("Could not load video for thumbnail generation."));
      };

      let captured = false;
      const captureFrame = () => {
        if (captured) return;
        captured = true;

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) {
          cleanup();
          reject(new Error("Video dimensions are unavailable."));
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");

        if (!context) {
          cleanup();
          reject(new Error("Canvas context is unavailable."));
          return;
        }

        context.drawImage(video, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              reject(new Error("Could not encode video thumbnail."));
              return;
            }
            resolve(new File([blob], `auto-video-thumbnail-${Date.now()}.jpg`, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.86
        );
      };

      video.onloadeddata = captureFrame;

      video.src = objectUrl;
    });
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use MP4 ou WebM.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_ARTICLE_VIDEO_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 80 MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingVideo(true);
    try {
      if (videoFileId) {
        await deleteArticleVideo(videoFileId).catch(() => {});
      }
      const uploaded = await uploadArticleVideo(file);
      const localUrl = URL.createObjectURL(file);
      setVideoFileId(uploaded.$id);
      setVideoPreviewUrl(getArticleVideoUrl(uploaded.$id));
      setVideoEnabled(true);

      if (!coverImageId && !videoThumbnailImageId) {
        try {
          const thumbnailFile = await extractFirstVideoFrame(file);
          const thumbnail = await uploadFile(thumbnailFile);
          setVideoThumbnailImageId(thumbnail.$id);
          setVideoThumbnailPreviewUrl(getFileView(thumbnail.$id));
        } catch {
          toast({
            title: "Thumbnail automÃ¡tica nÃ£o gerada",
            description: "O vÃ­deo foi enviado, mas nÃ£o foi possÃ­vel capturar o primeiro frame.",
          });
        }
      }

      const probe = document.createElement("video");
      probe.preload = "metadata";
      probe.onloadedmetadata = () => {
        if (Number.isFinite(probe.duration)) {
          setVideoDurationSeconds(Math.round(probe.duration));
        }
        URL.revokeObjectURL(localUrl);
      };
      probe.src = localUrl;
    } catch {
      toast({ title: "Erro ao enviar vídeo", variant: "destructive" });
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  async function handleRemoveVideo() {
    if (videoFileId) {
      await deleteArticleVideo(videoFileId).catch(() => {});
    }
    setVideoFileId(null);
    setVideoPreviewUrl(null);
    setVideoDurationSeconds(null);
    setVideoEnabled(false);
  }

  async function handleVideoThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
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

    setUploadingVideoThumbnail(true);
    try {
      if (videoThumbnailImageId) {
        await deleteFile(videoThumbnailImageId).catch(() => {});
      }
      const uploaded = await uploadFile(file);
      setVideoThumbnailImageId(uploaded.$id);
      setVideoThumbnailPreviewUrl(getFileView(uploaded.$id));
    } catch {
      toast({ title: "Erro ao enviar thumbnail", variant: "destructive" });
    } finally {
      setUploadingVideoThumbnail(false);
      if (videoThumbnailInputRef.current) videoThumbnailInputRef.current.value = "";
    }
  }

  async function handleRemoveVideoThumbnail() {
    if (!videoThumbnailImageId) return;
    await deleteFile(videoThumbnailImageId).catch(() => {});
    setVideoThumbnailImageId(null);
    setVideoThumbnailPreviewUrl(null);
  }

  function handleSelectFromGallery(fileId: string, fileUrl: string) {
    setCoverImageId(fileId);
    setCoverPreviewUrl(fileUrl);
    toast({
      title: "Imagem selecionada",
      description: "A imagem foi definida como capa do artigo.",
    });
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
      let savedId = id;
      if (isEditing && id) {
        await updateArticle(id, {
          title: title.trim(),
          slug: slug.trim(),
          content,
          excerpt: excerpt.trim(),
          coverImageId,
          videoFileId,
          videoThumbnailImageId,
          videoDurationSeconds,
          videoEnabled: videoEnabled && Boolean(videoFileId),
          videoCaption: videoCaption.trim(),
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
          videoFileId,
          videoThumbnailImageId,
          videoDurationSeconds,
          videoEnabled: videoEnabled && Boolean(videoFileId),
          videoCaption: videoCaption.trim(),
          categoryId,
          authorId: user?.id ?? "",
          isBreaking,
          isPublished: shouldPublish,
          publishedAt: new Date(publishedAt).toISOString(),
          tags,
        });
        savedId = created.id;
        toast({ title: "Artigo criado!" });
        navigate(`/admin/artigos/${created.id}/editar`, { replace: true });
      }

      const payload = {
        articleId: savedId,
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        coverUrl: coverImageId ? getFileView(coverImageId) : null,
        videoUrl: videoFileId ? getArticleVideoUrl(videoFileId) : null,
      };

      if (sendToWhatsapp) {
        const url = await getSetting("webhook_n8n_whatsapp");
        if (url) {
          triggerN8nWebhook(url, payload).catch(() => {
            toast({ title: "Erro ao disparar webhook WhatsApp", variant: "destructive" });
          });
        }
      }
      if (sendToEmail) {
        const url = await getSetting("webhook_n8n_email");
        if (url) {
          triggerN8nWebhook(url, payload).catch(() => {
            toast({ title: "Erro ao disparar webhook Email", variant: "destructive" });
          });
        }
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingCover ? "Enviando..." : "Enviar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setGalleryOpen(true)}
                    disabled={uploadingCover}
                  >
                    <Image className="h-4 w-4" />
                    Galeria
                  </Button>
                </div>
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

          {/* Article video */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Film className="h-4 w-4 text-primary" />
                Vídeo da notícia
              </h3>

              {videoPreviewUrl ? (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-md bg-black">
                    <video
                      src={videoPreviewUrl}
                      controls
                      playsInline
                      className="max-h-52 w-full bg-black object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                  >
                    <Upload className="h-4 w-4" />
                    Trocar vídeo
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {uploadingVideo ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <Play className="h-8 w-8" />
                      <span className="text-sm">Enviar vídeo</span>
                      <span className="text-xs">MP4 ou WebM - máx. 80 MB</span>
                    </>
                  )}
                </button>
              )}

              <input
                ref={videoInputRef}
                type="file"
                accept={ALLOWED_VIDEO_TYPES.join(",")}
                className="hidden"
                onChange={handleVideoUpload}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Legenda do vídeo</label>
                <Textarea
                  placeholder="Texto curto para aparecer no carrossel Reels"
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Mostrar no carrossel</label>
                <button
                  type="button"
                  onClick={() => setVideoEnabled((v) => !v)}
                  disabled={!videoFileId}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    videoEnabled && videoFileId ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      videoEnabled && videoFileId ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Thumbnail opcional</label>
                {videoThumbnailPreviewUrl ? (
                  <div className="relative">
                    <img
                      src={videoThumbnailPreviewUrl}
                      alt="Thumbnail do vídeo"
                      className="max-h-40 w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveVideoThumbnail}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => videoThumbnailInputRef.current?.click()}
                    disabled={uploadingVideoThumbnail}
                  >
                    {uploadingVideoThumbnail ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Image className="h-4 w-4" />
                    )}
                    Usar thumbnail própria
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  Se não enviar thumbnail, a imagem de capa será usada no carrossel.
                </p>
                <input
                  ref={videoThumbnailInputRef}
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  className="hidden"
                  onChange={handleVideoThumbnailUpload}
                />
              </div>
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

          {/* N8N Dispatch */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Disparos N8N
              </h3>
              <p className="text-xs text-muted-foreground">
                Ao salvar, dispara o webhook configurado nas Configurações.
              </p>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enviar no WhatsApp</label>
                <button
                  type="button"
                  onClick={() => setSendToWhatsapp((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    sendToWhatsapp ? "bg-emerald-500" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      sendToWhatsapp ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enviar por Email</label>
                <button
                  type="button"
                  onClick={() => setSendToEmail((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    sendToEmail ? "bg-blue-500" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      sendToEmail ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MediaGallery
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelect={handleSelectFromGallery}
      />
    </div>
  );
}
