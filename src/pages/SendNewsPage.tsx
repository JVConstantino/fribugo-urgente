import { useState, useRef, useEffect } from "react";
import {
  Send,
  Upload,
  X,
  Loader2,
  ImageIcon,
  Video,
  CheckCircle2,
  AlertCircle,
  MapPin,
  FileText,
  User,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { listCategories, createUserNews, uploadUserMedia, deleteUserMedia, getSetting } from "@/services/appwrite";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ALLOWED_USER_MEDIA_TYPES,
  MAX_USER_MEDIA_SIZE,
  MAX_MEDIA_FILES,
  MAX_DAILY_SUBMISSIONS,
  HCAPTCHA_SITE_KEY,
} from "@/lib/constants";

interface MediaFile {
  file: File;
  previewUrl: string;
  uploadedId: string | null;
  uploading: boolean;
  isVideo: boolean;
}

const RATE_LIMIT_KEY = "user_news_submissions";

function checkRateLimit(): boolean {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) return true;
    const data = JSON.parse(stored);
    const today = new Date().toISOString().slice(0, 10);
    if (data.date !== today) return true;
    return data.count < MAX_DAILY_SUBMISSIONS;
  } catch {
    return true;
  }
}

function incrementRateLimit(): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    let count = 0;
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) count = data.count;
    }
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ date: today, count: count + 1 }));
  } catch {
    // ignore
  }
}

export default function SendNewsPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    whatHappened: "",
    location: "",
    description: "",
    authorName: "",
    authorPhone: "",
    authorEmail: "",
  });

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Render hCaptcha
  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY || !captchaRef.current) return;

    const win = window as unknown as Record<string, unknown>;

    const renderCaptcha = () => {
      if (win.hcaptcha && captchaRef.current) {
        const hcaptchaApi = win.hcaptcha as { render: (el: HTMLElement, opts: Record<string, unknown>) => void };
        hcaptchaApi.render(captchaRef.current, {
          sitekey: HCAPTCHA_SITE_KEY,
          callback: (token: string) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(null),
          "error-callback": () => setCaptchaToken(null),
        });
      }
    };

    if (!win.hcaptcha) {
      const script = document.createElement("script");
      script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
      script.async = true;
      script.onload = renderCaptcha;
      document.head.appendChild(script);
    } else {
      renderCaptcha();
    }
  }, []);

  function handleFieldChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (mediaFiles.length + files.length > MAX_MEDIA_FILES) {
      toast({ title: `Máximo de ${MAX_MEDIA_FILES} arquivos.`, variant: "destructive" });
      return;
    }

    const newFiles: MediaFile[] = [];
    for (const file of files) {
      if (!ALLOWED_USER_MEDIA_TYPES.includes(file.type)) {
        toast({ title: `Formato inválido: ${file.name}`, variant: "destructive" });
        continue;
      }
      if (file.size > MAX_USER_MEDIA_SIZE) {
        toast({ title: `Arquivo muito grande (máx. 50MB): ${file.name}`, variant: "destructive" });
        continue;
      }
      const isVideo = file.type.startsWith("video/");
      newFiles.push({
        file,
        previewUrl: isVideo ? "" : URL.createObjectURL(file),
        uploadedId: null,
        uploading: false,
        isVideo,
      });
    }

    setMediaFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleRemoveMedia(index: number) {
    const item = mediaFiles[index];
    if (item.uploadedId) {
      await deleteUserMedia(item.uploadedId).catch(() => {});
    }
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function validateForm(): string | null {
    if (!form.title.trim() || form.title.trim().length < 5) return "O título deve ter pelo menos 5 caracteres.";
    if (!form.whatHappened.trim()) return "O campo 'O que ocorreu' é obrigatório.";
    if (!form.location.trim()) return "O campo 'Onde ocorreu' é obrigatório.";
    if (!form.description.trim() || form.description.trim().length < 50)
      return "A descrição deve ter pelo menos 50 caracteres.";
    if (!form.authorName.trim()) return "Seu nome é obrigatório.";
    if (!form.authorPhone.trim()) return "Seu WhatsApp é obrigatório.";
    if (!form.authorEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.authorEmail))
      return "Informe um e-mail válido.";
    if (HCAPTCHA_SITE_KEY && !captchaToken) return "Complete o captcha antes de enviar.";
    if (!checkRateLimit()) return `Você atingiu o limite de ${MAX_DAILY_SUBMISSIONS} envios por dia.`;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      toast({ title: error, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Upload all media files first
      const uploadedIds: string[] = [];
      const filesToUpload = mediaFiles.filter((m) => !m.uploadedId);

      for (let i = 0; i < filesToUpload.length; i++) {
        const idx = mediaFiles.indexOf(filesToUpload[i]);
        setMediaFiles((prev) =>
          prev.map((m, j) => (j === idx ? { ...m, uploading: true } : m))
        );
        try {
          const uploaded = await uploadUserMedia(filesToUpload[i].file);
          uploadedIds.push(uploaded.$id);
          setMediaFiles((prev) =>
            prev.map((m, j) =>
              j === idx ? { ...m, uploadedId: uploaded.$id, uploading: false } : m
            )
          );
        } catch {
          toast({ title: `Erro ao enviar ${filesToUpload[i].file.name}`, variant: "destructive" });
          setMediaFiles((prev) =>
            prev.map((m, j) => (j === idx ? { ...m, uploading: false } : m))
          );
        }
      }

      // Create the news submission
      const created = await createUserNews({
        title: form.title.trim(),
        categoryId: form.categoryId || null,
        description: form.description.trim(),
        location: form.location.trim(),
        whatHappened: form.whatHappened.trim(),
        mediaIds: [...mediaFiles.filter((m) => m.uploadedId).map((m) => m.uploadedId!), ...uploadedIds],
        authorName: form.authorName.trim(),
        authorPhone: form.authorPhone.replace(/\D/g, "").replace(/^/, "+55"),
        authorEmail: form.authorEmail.trim(),
      });

      // Trigger N8n webhook (fire and forget)
      getSetting("n8n_webhook_url").then((webhookUrl) => {
        if (webhookUrl) {
          fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "new_user_news",
              newsId: created.id,
              title: created.title,
              authorName: created.authorName,
              authorPhone: created.authorPhone,
              authorEmail: created.authorEmail,
              location: created.location,
              whatHappened: created.whatHappened,
              description: created.description,
              categoryId: created.categoryId,
              mediaIds: created.mediaIds,
              createdAt: created.createdAt,
            }),
          }).catch(() => {});
        }
      }).catch(() => {});

      incrementRateLimit();
      setSuccess(true);
      toast({ title: "Notícia enviada com sucesso!" });

      // Reset form
      setForm({
        title: "",
        categoryId: "",
        whatHappened: "",
        location: "",
        description: "",
        authorName: "",
        authorPhone: "",
        authorEmail: "",
      });
      setMediaFiles([]);
      setCaptchaToken(null);
    } catch {
      toast({ title: "Erro ao enviar notícia. Tente novamente.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <Card>
          <CardContent className="pt-12 pb-12">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Notícia enviada!</h2>
            <p className="text-muted-foreground mb-6">
              Sua notícia foi recebida e será analisada pela nossa equipe. Você receberá uma
              confirmação no WhatsApp em breve.
            </p>
            <Button onClick={() => setSuccess(false)}>Enviar outra notícia</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Coming Soon Banner */}
      <div className="mb-6 flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-900">
        <Clock className="h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold text-sm">Em Breve</p>
          <p className="text-xs">Este recurso estará disponível em breve. Você já pode visualizar o formulário.</p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Send className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Envie sua notícia</h1>
        <p className="mt-2 text-muted-foreground">
          Tem uma denúncia, notícia ou acontecimento? Envie para nossa redação.
          Sua contribuição é importante para a comunidade.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6 opacity-60 pointer-events-none">
        {/* Sobre o fato */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Sobre o fato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Título da notícia *</label>
              <Input
                placeholder="Ex: Alagamento na Rua XV de Novembro"
                value={form.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                maxLength={150}
              />
              <p className="text-xs text-muted-foreground text-right">{form.title.length}/150</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoria</label>
              <select
                value={form.categoryId}
                onChange={(e) => handleFieldChange("categoryId", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione (opcional)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">O que ocorreu? *</label>
              <Input
                placeholder="Ex: Forte chuva causou alagamento"
                value={form.whatHappened}
                onChange={(e) => handleFieldChange("whatHappened", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Onde ocorreu? *
              </label>
              <Input
                placeholder="Ex: Rua XV de Novembro, Centro, Nova Friburgo"
                value={form.location}
                onChange={(e) => handleFieldChange("location", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descreva o que aconteceu *</label>
              <textarea
                placeholder="Conte com detalhes o que aconteceu, quando ocorreu, quem está envolvido..."
                value={form.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
              <p className="text-xs text-muted-foreground">
                {form.description.length} caracteres (mínimo 50)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mídia */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Fotos e Vídeos
              <Badge variant="secondary" className="text-xs ml-auto">Opcional</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mediaFiles.length < MAX_MEDIA_FILES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-sm">
                    Clique para enviar fotos ou vídeos ({mediaFiles.length}/{MAX_MEDIA_FILES})
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_USER_MEDIA_TYPES.join(",")}
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <p className="text-xs text-muted-foreground">
                Formatos: JPEG, PNG, WebP, GIF, MP4, MOV, WebM. Máximo 30MB por arquivo.
              </p>

              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {mediaFiles.map((item, index) => (
                    <div key={index} className="relative group rounded-md overflow-hidden border border-border bg-muted">
                      {item.isVideo ? (
                        <div className="flex items-center justify-center h-24">
                          <Video className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground ml-2">{item.file.name}</span>
                        </div>
                      ) : (
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="h-24 w-full object-cover"
                        />
                      )}
                      {item.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                      {item.uploadedId && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(index)}
                        className="absolute top-1 left-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dados do autor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Seus dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Nome completo *
              </label>
              <Input
                placeholder="Seu nome"
                value={form.authorName}
                onChange={(e) => handleFieldChange("authorName", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  WhatsApp *
                </label>
                <Input
                  type="tel"
                  placeholder="(22) 99999-9999"
                  value={form.authorPhone}
                  onChange={(e) => handleFieldChange("authorPhone", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  E-mail *
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={form.authorEmail}
                  onChange={(e) => handleFieldChange("authorEmail", e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Seus dados serão utilizados apenas para contato sobre esta notícia e não serão
                compartilhados publicamente. O WhatsApp será usado para enviar a confirmação de
                recebimento.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Captcha + Submit */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {HCAPTCHA_SITE_KEY && (
              <div className="flex justify-center">
                <div ref={captchaRef} />
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar notícia
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Ao enviar, você concorda que o conteúdo é verdadeiro e pode ser publicado pelo portal.
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
