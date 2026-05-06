import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>

        <article className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Política de Privacidade</h1>
            <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Introdução</h2>
            <p className="text-foreground/90">
              A privacidade dos nossos usuários é importante para nós. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você visita o Friburgo Urgente.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Informações que Coletamos</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium mb-1">2.1 Informações de Navegação</h3>
                <p className="text-foreground/90">Coletamos automaticamente informações sobre sua navegação, incluindo geolocalização aproximada (cidade/estado) através de IP, páginas visitadas, tempo de permanência e dispositivo utilizado.</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">2.2 Informações de Cookies</h3>
                <p className="text-foreground/90">Utilizamos cookies para consentimento de privacidade e preferências de navegação. Você pode gerenciar essas preferências através do banner de cookies.</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">2.3 Informações Fornecidas Voluntariamente</h3>
                <p className="text-foreground/90">Quando você se inscreve na newsletter, envia uma notícia ou interage com nossos formulários, coletamos informações como nome, email e telefone.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Como Usamos Suas Informações</h2>
            <ul className="space-y-2 text-foreground/90">
              <li className="flex gap-3">
                <span className="text-primary font-semibold">•</span>
                <span>Melhorar sua experiência de navegação</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-semibold">•</span>
                <span>Entender como os usuários interagem com nosso conteúdo</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-semibold">•</span>
                <span>Enviar newsletter e comunicações (apenas com consentimento)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-semibold">•</span>
                <span>Processar notícias enviadas por internautas</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-semibold">•</span>
                <span>Analisar desempenho de conteúdo e anúncios</span>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Compartilhamento de Dados</h2>
            <p className="text-foreground/90">
              Não compartilhamos suas informações pessoais com terceiros, exceto quando necessário para operar nossos serviços (como provedores de email para newsletter) ou quando legalmente obrigados a fazê-lo.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Segurança dos Dados</h2>
            <p className="text-foreground/90">
              Implementamos medidas de segurança técnicas e administrativas para proteger suas informações contra acesso não autorizado, alteração ou destruição. No entanto, nenhum método de transmissão pela Internet é 100% seguro.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Retenção de Dados</h2>
            <p className="text-foreground/90">
              Mantemos seus dados apenas pelo tempo necessário para fornecer nossos serviços. Dados de navegação são agregados anonimamente. Você pode solicitar a exclusão de seus dados a qualquer momento.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Seus Direitos</h2>
            <ul className="space-y-2 text-foreground/90">
              <li className="flex gap-3">
                <span className="text-primary font-semibold">•</span>
                <span>Direito de acessar seus dados pessoais</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-semibold">•</span>
                <span>Direito de corrigir dados incorretos</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-semibold">•</span>
                <span>Direito de solicitar exclusão de dados</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-semibold">•</span>
                <span>Direito de gerenciar suas preferências de comunicação</span>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Conformidade LGPD</h2>
            <p className="text-foreground/90">
              O Friburgo Urgente está em conformidade com a Lei Geral de Proteção de Dados (LGPD). Você tem direito a consentir ou rejeitar o uso de cookies. Seu consentimento é solicitado na primeira visita e respeita suas preferências.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Alterações nesta Política</h2>
            <p className="text-foreground/90">
              Podemos atualizar esta Política de Privacidade ocasionalmente. Notificaremos sobre mudanças significativas através de aviso no site.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Contato</h2>
            <p className="text-foreground/90">
              Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco através do formulário no site ou por email.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
