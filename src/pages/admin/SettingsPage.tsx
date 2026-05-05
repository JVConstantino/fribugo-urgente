import { useEffect, useState } from "react";
import {
  Brain,
  Webhook,
  MessageCircle,
  Loader2,
  Save,
  Eye,
  EyeOff,
  TestTube2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getAIConfig, saveAIConfig, getSetting, saveSetting } from "@/services/supabase";
import type { SaveAIConfigData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

const DEFAULT_SYSTEM_PROMPT = `Você é um assistente de análise de notícias de um portal de notícias local.
Analise a notícia enviada por um internauta e forneça:

1. RESUMO: Um resumo conciso da notícia (2-3 frases)
2. CATEGORIA: A categoria mais adequada (ex: Política, Segurança, Meio Ambiente, Saúde, Educação, Trânsito, Cultura, Esportes, Economia, Social)
3. ANÁLISE: Uma análise breve incluindo:
   - Relevância local
   - Pontos que precisam de verificação
   - Sugestão de ângulo para cobertura jornalística

Responda em JSON com as chaves: summary, category, analysis`;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showEvoToken, setShowEvoToken] = useState(false);

  // AI Config
  const [aiForm, setAiForm] = useState<SaveAIConfigData>({
    provider: "openrouter",
    apiKey: "",
    endpoint: "https://openrouter.ai/api/v1",
    model: "",
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    isActive: true,
  });

  // Webhooks N8N
  const [webhookWhatsapp, setWebhookWhatsapp] = useState("");
  const [webhookEmail, setWebhookEmail] = useState("");
  const [webhookUserNews, setWebhookUserNews] = useState("");

  // Evo API (WhatsApp)
  const [evoUrl, setEvoUrl] = useState("");
  const [evoToken, setEvoToken] = useState("");
  const [evoNumber, setEvoNumber] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const [config, wh_whatsapp, wh_email, wh_usernews, evUrl, evToken, evNumber] = await Promise.all([
        getAIConfig(),
        getSetting("webhook_n8n_whatsapp"),
        getSetting("webhook_n8n_email"),
        getSetting("webhook_n8n_user_news"),
        getSetting("evo_api_url"),
        getSetting("evo_api_token"),
        getSetting("evo_phone_number"),
      ]);

      if (config) {
        setAiForm({
          provider: config.provider,
          apiKey: config.apiKey,
          endpoint: config.endpoint,
          model: config.model,
          systemPrompt: config.systemPrompt,
          isActive: config.isActive,
        });
      }
      if (wh_whatsapp) setWebhookWhatsapp(wh_whatsapp);
      if (wh_email) setWebhookEmail(wh_email);
      if (wh_usernews) setWebhookUserNews(wh_usernews);
      if (evUrl) setEvoUrl(evUrl);
      if (evToken) setEvoToken(evToken);
      if (evNumber) setEvoNumber(evNumber);
    } catch {
      toast({ title: "Erro ao carregar configurações", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAI() {
    setSaving(true);
    try {
      await saveAIConfig(aiForm);
      toast({ title: "Configurações de IA salvas!" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar configurações de IA";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWebhooks() {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("webhook_n8n_whatsapp", webhookWhatsapp),
        saveSetting("webhook_n8n_email", webhookEmail),
        saveSetting("webhook_n8n_user_news", webhookUserNews),
      ]);
      toast({ title: "Webhooks N8N salvos!" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar webhooks";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEvo() {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("evo_api_url", evoUrl),
        saveSetting("evo_api_token", evoToken),
        saveSetting("evo_phone_number", evoNumber),
      ]);
      toast({ title: "Configurações do WhatsApp salvas!" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar configurações";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestWebhook(url: string) {
    if (!url) {
      toast({ title: "Informe a URL do webhook primeiro.", variant: "destructive" });
      return;
    }
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true, message: "Teste de conexão do Friburgo Urgente" }),
      });
      toast({ title: "Webhook testado! Verifique o N8N." });
    } catch {
      toast({ title: "Erro ao testar webhook. Verifique a URL.", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Configure integrações de IA, webhooks e WhatsApp
        </p>
      </div>

      {/* Required collections notice */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-2">Collections necessárias no Appwrite</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Antes de salvar, certifique-se de que estas collections existem no banco de dados:
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs font-mono">system_settings</Badge>
            <Badge variant="outline" className="text-xs font-mono">ai_config</Badge>
            <Badge variant="outline" className="text-xs font-mono">user_news</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            E o bucket de storage: <Badge variant="outline" className="text-xs font-mono">user_media</Badge>
          </p>
        </CardContent>
      </Card>

      {/* AI Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Configurações de IA
            <Badge variant={aiForm.isActive ? "default" : "secondary"} className="ml-auto text-xs">
              {aiForm.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Provider</label>
              <select
                value={aiForm.provider}
                onChange={(e) => setAiForm((f) => ({ ...f, provider: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Modelo</label>
              <Input
                placeholder="ex: anthropic/claude-sonnet-4-20250514"
                value={aiForm.model}
                onChange={(e) => setAiForm((f) => ({ ...f, model: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">API Key</label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                placeholder="sk-or-..."
                value={aiForm.apiKey}
                onChange={(e) => setAiForm((f) => ({ ...f, apiKey: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Endpoint</label>
            <Input
              placeholder="https://openrouter.ai/api/v1"
              value={aiForm.endpoint}
              onChange={(e) => setAiForm((f) => ({ ...f, endpoint: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">System Prompt</label>
            <textarea
              value={aiForm.systemPrompt}
              onChange={(e) => setAiForm((f) => ({ ...f, systemPrompt: e.target.value }))}
              rows={8}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">IA ativa</label>
            <button
              type="button"
              onClick={() => setAiForm((f) => ({ ...f, isActive: !f.isActive }))}
              className="text-primary"
            >
              {aiForm.isActive ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>

          <Button onClick={handleSaveAI} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar configurações de IA
          </Button>
        </CardContent>
      </Card>

      {/* Webhooks N8N */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-4 w-4 text-primary" />
            Webhooks N8N
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Configure as URLs dos webhooks do N8N para cada tipo de disparo. Elas serão
            chamadas ao publicar artigos ou receber notícias de internautas.
          </p>

          {/* Webhook WhatsApp */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              Disparo WhatsApp
            </label>
            <p className="text-xs text-muted-foreground">Chamado ao salvar artigo com "Enviar no WhatsApp" ativo.</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://seu-n8n.com/webhook/whatsapp"
                value={webhookWhatsapp}
                onChange={(e) => setWebhookWhatsapp(e.target.value)}
              />
              <Button variant="outline" size="icon" onClick={() => handleTestWebhook(webhookWhatsapp)}>
                <TestTube2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Webhook Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Webhook className="h-4 w-4 text-blue-500" />
              Disparo Email
            </label>
            <p className="text-xs text-muted-foreground">Chamado ao salvar artigo com "Enviar por Email" ativo.</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://seu-n8n.com/webhook/email"
                value={webhookEmail}
                onChange={(e) => setWebhookEmail(e.target.value)}
              />
              <Button variant="outline" size="icon" onClick={() => handleTestWebhook(webhookEmail)}>
                <TestTube2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Webhook User News */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Webhook className="h-4 w-4 text-orange-500" />
              Nova Notícia de Internauta
            </label>
            <p className="text-xs text-muted-foreground">Chamado quando um internauta envia uma notícia pelo formulário público.</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://seu-n8n.com/webhook/user-news"
                value={webhookUserNews}
                onChange={(e) => setWebhookUserNews(e.target.value)}
              />
              <Button variant="outline" size="icon" onClick={() => handleTestWebhook(webhookUserNews)}>
                <TestTube2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button onClick={handleSaveWebhooks} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar webhooks
          </Button>
        </CardContent>
      </Card>

      {/* Evo API (WhatsApp) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-500" />
            WhatsApp (Evo API)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure a Evo API para enviar mensagens de confirmação no WhatsApp quando uma notícia for recebida.
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">URL da instância Evo</label>
            <Input
              placeholder="https://sua-evo-api.com"
              value={evoUrl}
              onChange={(e) => setEvoUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Token de autenticação</label>
            <div className="relative">
              <Input
                type={showEvoToken ? "text" : "password"}
                placeholder="Token da API"
                value={evoToken}
                onChange={(e) => setEvoToken(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowEvoToken(!showEvoToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showEvoToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Número remetente</label>
            <Input
              placeholder="5522999999999"
              value={evoNumber}
              onChange={(e) => setEvoNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Formato: código do país + DDD + número (sem + ou espaços)</p>
          </div>
          <Button onClick={handleSaveEvo} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar configurações WhatsApp
          </Button>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-2">Fluxo de processamento N8n</h3>
          <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Internauta envia notícia pelo formulário público</li>
            <li>Sistema salva no Appwrite com status <Badge variant="secondary" className="text-xs">pending</Badge></li>
            <li>Frontend dispara webhook para o N8n com o ID da notícia</li>
            <li>N8n lê a notícia do Appwrite e envia para a IA (OpenRouter)</li>
            <li>IA analisa, resume e classifica a notícia</li>
            <li>N8n atualiza o documento no Appwrite com a análise da IA (status: <Badge variant="default" className="text-xs">processed</Badge>)</li>
            <li>N8n envia WhatsApp via Evo API para o autor confirmando recebimento</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
