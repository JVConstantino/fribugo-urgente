import { useEffect, useState } from "react";
import { Mail, MessageCircle, Users, Loader2 } from "lucide-react";
import { listNewsletterSubscribers, unsubscribe } from "@/services/supabase";
import type { Newsletter } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

type ChannelFilter = "all" | "email" | "whatsapp" | "both";

const channelLabel: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  both: "Ambos",
};

const channelVariant: Record<string, "default" | "secondary" | "outline"> = {
  email: "secondary",
  whatsapp: "default",
  both: "outline",
};

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ChannelFilter>("all");
  const [deactivating, setDeactivating] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await listNewsletterSubscribers();
      setSubscribers(data);
    } catch {
      toast({ title: "Erro ao carregar inscritos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(id: string) {
    setDeactivating(id);
    try {
      await unsubscribe(id);
      setSubscribers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: false } : s))
      );
      toast({ title: "Inscrito desativado." });
    } catch {
      toast({ title: "Erro ao desativar inscrito", variant: "destructive" });
    } finally {
      setDeactivating(null);
    }
  }

  const filtered = filter === "all" ? subscribers : subscribers.filter((s) => s.channel === filter);
  const activeCount = subscribers.filter((s) => s.isActive).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Newsletter</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os inscritos para receber notícias por email ou WhatsApp
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["all", "email", "whatsapp", "both"] as ChannelFilter[]).map((ch) => {
          const count = ch === "all"
            ? activeCount
            : subscribers.filter((s) => s.isActive && s.channel === ch).length;
          return (
            <Card
              key={ch}
              className={`cursor-pointer transition-colors ${filter === ch ? "border-primary bg-primary/5" : ""}`}
              onClick={() => setFilter(ch)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                {ch === "email" && <Mail className="h-5 w-5 text-blue-500" />}
                {ch === "whatsapp" && <MessageCircle className="h-5 w-5 text-emerald-500" />}
                {ch === "both" && <Users className="h-5 w-5 text-purple-500" />}
                {ch === "all" && <Users className="h-5 w-5 text-primary" />}
                <div>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {ch === "all" ? "Total ativos" : channelLabel[ch]}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Inscritos {filter !== "all" && `— ${channelLabel[filter]}`}
            <span className="ml-2 text-muted-foreground font-normal text-sm">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Nenhum inscrito encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Canal</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inscrito em</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{s.name || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3">{s.email}</td>
                      <td className="px-4 py-3">{s.phone || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3">
                        <Badge variant={channelVariant[s.channel]}>
                          {channelLabel[s.channel]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(s.subscribedAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.isActive ? "default" : "secondary"}>
                          {s.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {s.isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeactivate(s.id)}
                            disabled={deactivating === s.id}
                          >
                            {deactivating === s.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Desativar"
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
