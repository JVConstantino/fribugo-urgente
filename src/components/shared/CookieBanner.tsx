import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { COOKIE_CONSENT_DAYS } from "@/lib/constants";

const COOKIE_NAME = "cookie_consent";

function getConsent(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return match ? match[1] : null;
}

function setConsent(value: "accepted" | "rejected") {
  const maxAge = COOKIE_CONSENT_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  function handle(choice: "accepted" | "rejected") {
    setConsent(choice);
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-4xl bg-card border border-border rounded-xl shadow-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie className="h-6 w-6 text-primary shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1 text-sm text-muted-foreground">
          Usamos cookies para melhorar sua experiência de navegação. Ao continuar, você concorda com nossa{" "}
          <Link to="/privacidade" className="underline text-foreground hover:text-primary transition-colors">
            Política de Privacidade
          </Link>
          .
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => handle("rejected")}
          >
            Rejeitar
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => handle("accepted")}
          >
            Aceitar
          </Button>
          <button
            onClick={() => handle("rejected")}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
