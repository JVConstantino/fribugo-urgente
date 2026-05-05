import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Send, Newspaper, LayoutGrid, MessageCircle, Mail } from "lucide-react";
import { subscribe } from "@/services/supabase";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type Channel = "email" | "whatsapp" | "both";

export function Footer() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [isSubscribing, setIsSubscribing] = useState(false);

  async function handleSubscribe(e: FormEvent) {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({ title: "E-mail inválido", description: "Por favor, insira um e-mail válido.", variant: "destructive" });
      return;
    }

    if ((channel === "whatsapp" || channel === "both") && !phone.trim()) {
      toast({ title: "Telefone obrigatório", description: "Informe seu WhatsApp para este canal.", variant: "destructive" });
      return;
    }

    setIsSubscribing(true);
    try {
      await subscribe(trimmedEmail, {
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        channel,
      });
      toast({ title: "Inscrição realizada!", description: "Você receberá as principais notícias em breve." });
      setName(""); setEmail(""); setPhone(""); setChannel("email");
    } catch {
      toast({ title: "Erro ao inscrever", description: "Não foi possível realizar a inscrição. Tente novamente.", variant: "destructive" });
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
            <img src="/logo-navbar.png" alt={APP_NAME} className="h-16 w-auto" />
            <p className="mt-3 text-sm leading-relaxed text-secondary-foreground/80">
              {APP_DESCRIPTION}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground/60 mb-4">
              Links rápidos
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="flex items-center gap-2 text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                  <Newspaper className="h-4 w-4" />
                  Início
                </Link>
              </li>
              <li>
                <Link to="/categorias" className="flex items-center gap-2 text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
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
              Receba as principais notícias de Friburgo e região.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <Input
                placeholder="Seu nome (opcional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubscribing}
                className="h-9 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50 focus-visible:ring-primary"
              />
              <Input
                type="email"
                placeholder="Seu e-mail *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubscribing}
                required
                className="h-9 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50 focus-visible:ring-primary"
              />

              {/* Canal */}
              <div className="flex gap-1">
                {(["email", "whatsapp", "both"] as Channel[]).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      channel === ch
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary-foreground/10 text-secondary-foreground/70 hover:bg-secondary-foreground/20"
                    }`}
                  >
                    {ch === "email" && <Mail className="h-3 w-3" />}
                    {ch === "whatsapp" && <MessageCircle className="h-3 w-3" />}
                    {ch === "both" && <Send className="h-3 w-3" />}
                    {ch === "email" ? "Email" : ch === "whatsapp" ? "WhatsApp" : "Ambos"}
                  </button>
                ))}
              </div>

              {(channel === "whatsapp" || channel === "both") && (
                <Input
                  type="tel"
                  placeholder="Seu WhatsApp (ex: 5522999999999)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubscribing}
                  className="h-9 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50 focus-visible:ring-primary"
                />
              )}

              <Button type="submit" disabled={isSubscribing || !email.trim()} size="sm" className="w-full">
                <Send className="h-4 w-4" />
                {isSubscribing ? "Inscrevendo..." : "Inscrever-se"}
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
