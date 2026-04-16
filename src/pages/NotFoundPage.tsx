import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { Helmet } from "react-helmet-async";

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>{`Pagina nao encontrada - ${APP_NAME}`}</title>
      </Helmet>

      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 text-8xl font-black text-primary">404</div>
        <h1 className="mb-3 text-2xl font-bold sm:text-3xl">
          Pagina nao encontrada
        </h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          A pagina que voce procura nao existe ou foi movida para outro endereco.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
              Ir para o inicio
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
