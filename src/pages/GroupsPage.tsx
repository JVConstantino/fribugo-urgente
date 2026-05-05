import { useEffect, useState } from "react";
import { MessageCircle, ExternalLink } from "lucide-react";
import { listGroups, getFileView, incrementGroupClick } from "@/services/supabase";
import type { WhatsAppGroup } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_NAME } from "@/lib/constants";
import { Helmet } from "react-helmet-async";

export default function GroupsPage() {
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listGroups(true)
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  // Group by category
  const byCategory = groups.reduce<Record<string, WhatsAppGroup[]>>((acc, g) => {
    const cat = g.category || "Geral";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(g);
    return acc;
  }, {});

  const categoryNames = Object.keys(byCategory);

  return (
    <>
      <Helmet>
        <title>{`Grupos de WhatsApp - ${APP_NAME}`}</title>
        <meta
          name="description"
          content={`Participe dos grupos de WhatsApp do ${APP_NAME} e fique por dentro das principais notícias de Nova Friburgo.`}
        />
      </Helmet>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <MessageCircle className="h-7 w-7" />
            </span>
          </div>
          <h1 className="text-3xl font-bold">Grupos de WhatsApp</h1>
          <p className="mt-2 text-muted-foreground">
            Entre nos nossos grupos e fique por dentro de tudo que acontece em Nova Friburgo
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="py-16 text-center">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum grupo disponível no momento.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categoryNames.map((cat) => (
              <section key={cat}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <span className="h-1 w-6 rounded bg-primary" />
                  {cat}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {byCategory[cat].map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function GroupCard({ group }: { group: WhatsAppGroup }) {
  return (
    <a
      href={group.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      onClick={() => incrementGroupClick(group.id).catch(() => {})}
    >
      <Card className="transition-shadow hover:shadow-md hover:border-green-300">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon / Image */}
            <div className="shrink-0">
              {group.imageId ? (
                <img
                  src={getFileView(group.imageId)}
                  alt={group.title}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <MessageCircle className="h-6 w-6" />
                </span>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-snug group-hover:text-green-600 transition-colors">
                  {group.title}
                </h3>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-green-600 transition-colors mt-0.5" />
              </div>
              {group.description && (
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                  {group.description}
                </p>
              )}
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className="text-xs border-green-300 text-green-700"
                >
                  Entrar no grupo
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
