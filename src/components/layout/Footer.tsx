import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Send, Newspaper, LayoutGrid } from "lucide-react";
import { subscribe } from "@/services/supabase";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  async function handleSubscribe(e: FormEvent) {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "E-mail invalido",
        description: "Por favor, insira um e-mail valido.",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);

    try {
      await subscribe(trimmedEmail);
      toast({
        title: "Inscricao realizada!",
        description: "Voce recebera as principais noticies no seu e-mail.",
      });
      setEmail("");
    } catch {
      toast({
        title: "Erro ao inscrever",
        description:
          "Nao foi possivel realizar a inscricao. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <h2 className="text-xl font-black tracking-tight text-primary">
              {APP_NAME.toUpperCase()}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary-foreground/80">
              {APP_DESCRIPTION}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground/60 mb-4">
              Links rapidos
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/"
                  className="flex items-center gap-2 text-sm text-secondary-foreground/80 hover:text-primary transition-colors"
                >
                  <Newspaper className="h-4 w-4" />
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  to="/categorias"
                  className="flex items-center gap-2 text-sm text-secondary-foreground/80 hover:text-primary transition-colors"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Categorias
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground/60 mb-4">
              Newsletter
            </h3>
            <p className="text-sm text-secondary-foreground/80 mb-3">
              Receba as principais noticies de Friburgo e regiao no seu e-mail.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubscribing}
                className="h-9 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50 focus-visible:ring-primary"
              />
              <Button
                type="submit"
                disabled={isSubscribing || !email.trim()}
                size="default"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-secondary-foreground/15 text-center">
          <p className="text-xs text-secondary-foreground/50">
            &copy; {currentYear} {APP_NAME}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
