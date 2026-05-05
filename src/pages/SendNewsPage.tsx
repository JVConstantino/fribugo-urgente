import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SendNewsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Envie suas Notícias</h1>
        <p className="text-lg text-muted-foreground">
          Compartilhe os acontecimentos mais importantes de Friburgo com a gente.
        </p>
      </div>

      <Card className="mb-8 border-amber-200 bg-amber-50">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                Em Breve!
              </p>
              <p className="text-amber-800 text-sm mt-1">
                O formulário para envio de notícias está sendo aprimorado.
                Volte em breve para compartilhar suas histórias com a comunidade de Friburgo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-8 pb-8">
          <div className="space-y-4 text-muted-foreground">
            <p>
              <strong>O que você poderá fazer:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Enviar fotos e vídeos dos acontecimentos</li>
              <li>Descrever o que ocorreu em detalhes</li>
              <li>Indicar a localização exata do evento</li>
              <li>Receber feedback de nossa equipe editorial</li>
            </ul>
            <p className="pt-4">
              Enquanto isso, continue acompanhando as notícias e grupos de WhatsApp da comunidade.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
