import { useState, type FormEvent, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, MessageCircle, Mail } from "lucide-react";
import { subscribe, listCategories } from "@/services/supabase";
import type { Category } from "@/types";
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
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

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
  const displayCategories = categories.slice(0, 6);

  return (
    <footer className="bg-secondary text-secondary-foreground mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* 4 columns: Brand, Navigation, Categories, Newsletter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 mb-10">
          {/* Column 1: Brand */}
          <div>
            <img src="/logo-navbar.png" alt={APP_NAME} className="h-16 w-auto" />
            <p className="mt-3 text-sm leading-relaxed text-secondary-foreground/80">
              {APP_DESCRIPTION}
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground/60 mb-4">
              Navegação
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/buscar" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                  Buscar
                </Link>
              </li>
              <li>
                <Link to="/grupos" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                  Grupos WhatsApp
                </Link>
              </li>
              <li>
                <Link to="/enviar-noticia" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                  Enviar Notícia
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground/60 mb-4">
              Categorias
            </h3>
            <ul className="space-y-2.5">
              {displayCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/categoria/${cat.slug}`}
                    className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground/60 mb-4">
              Newsletter
            </h3>
            <p className="text-sm text-secondary-foreground/80 mb-3">
              Receba as principais notícias de Friburgo.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <Input
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubscribing}
                className="h-9 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50 focus-visible:ring-primary text-xs"
              />
              <Input
                type="email"
                placeholder="E-mail *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubscribing}
                required
                className="h-9 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50 focus-visible:ring-primary text-xs"
              />

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
                  </button>
                ))}
              </div>

              {(channel === "whatsapp" || channel === "both") && (
                <Input
                  type="tel"
                  placeholder="WhatsApp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubscribing}
                  className="h-9 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50 focus-visible:ring-primary text-xs"
                />
              )}

              <Button type="submit" disabled={isSubscribing || !email.trim()} size="sm" className="w-full">
                <Send className="h-4 w-4" />
                Inscrever
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom: Copyright + Social */}
        <div className="border-t border-secondary-foreground/15 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-secondary-foreground/50">
              &copy; {currentYear} {APP_NAME} · Desenvolvido por <a href="https://constantino.dev" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Constantino.dev</a>
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-secondary-foreground/60 hover:text-primary transition-colors" title="Instagram">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                  <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="0" fill="none" className="fill-current"/>
                  <circle cx="18.406" cy="5.594" r="1.44"/>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-secondary-foreground/60 hover:text-primary transition-colors" title="Facebook">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5c-.563-.074-2.313-.229-4.425-.229-4.813 0-8.148 2.477-8.148 7.571v2.328z"/>
                </svg>
              </a>
              <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="text-secondary-foreground/60 hover:text-primary transition-colors" title="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
