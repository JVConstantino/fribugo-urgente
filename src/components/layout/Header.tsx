import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  ChevronDown,
  Shield,
  Home,
  LayoutGrid,
  MessageCircle,
  MapPin,
  Cloud,
} from "lucide-react";
import { listCategories } from "@/services/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import type { Category } from "@/types";
import { APP_NAME } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// ─── Weather helpers ─────────────────────────────────────────────────────────

interface WeatherData {
  temp: number;
  emoji: string;
  city: string;
}

function wmoEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌦️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

const FALLBACK_LAT = -22.2822;
const FALLBACK_LON = -42.5311;
const FALLBACK_CITY = "Nova Friburgo";

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const [meteoRes, geoRes] = await Promise.all([
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`
    ),
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    ),
  ]);
  const meteo = await meteoRes.json();
  const geo = await geoRes.json();

  const temp = Math.round(meteo?.current?.temperature_2m ?? 0);
  const code = meteo?.current?.weathercode ?? 0;
  const city =
    geo?.address?.city ||
    geo?.address?.town ||
    geo?.address?.village ||
    FALLBACK_CITY;

  return { temp, emoji: wmoEmoji(code), city };
}

// ─── Clock helper ─────────────────────────────────────────────────────────────

function formatClock(d: Date): string {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const day = days[d.getDay()];
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return `${day}, ${date} · ${time}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Header() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [clockStr, setClockStr] = useState(() => formatClock(new Date()));

  // Clock — update every second
  useEffect(() => {
    const id = setInterval(() => setClockStr(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  // Weather — geolocation then Open-Meteo + Nominatim
  useEffect(() => {
    async function loadWeather(lat: number, lon: number) {
      try {
        const data = await fetchWeather(lat, lon);
        setWeather(data);
      } catch {
        // fallback to Nova Friburgo on error
        try {
          const data = await fetchWeather(FALLBACK_LAT, FALLBACK_LON);
          setWeather(data);
        } catch {
          // silently fail
        }
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
        () => loadWeather(FALLBACK_LAT, FALLBACK_LON),
        { timeout: 5000 }
      );
    } else {
      loadWeather(FALLBACK_LAT, FALLBACK_LON);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((cats) => { if (!cancelled) setCategories(cats); })
      .catch(() => { if (!cancelled) setCategories([]); });
    return () => { cancelled = true; };
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">

      {/* ── Utility bar: clock + weather ── */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-8">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            🕐 {clockStr}
          </span>
          {weather ? (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              {weather.emoji} {weather.temp}°C
              <MapPin className="h-3 w-3 ml-1" />
              {weather.city}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Cloud className="h-3 w-3" /> Carregando...
            </span>
          )}
        </div>
      </div>

      {/* ── Main nav bar ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">

          {/* Logo — left */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img src="/logo-navbar.png" alt="Friburgo Urgente" className="hidden sm:block h-10 w-auto" />
            <img src="/logo-icon.png" alt="Friburgo Urgente" className="block sm:hidden h-9 w-auto" />
          </Link>

          {/* Desktop Navigation — absolutely centered */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md hover:bg-muted"
            >
              <Home className="h-4 w-4" />
              Início
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md hover:bg-muted">
                  <LayoutGrid className="h-4 w-4" />
                  Categorias
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 bg-popover">
                {categories.length === 0 ? (
                  <DropdownMenuItem disabled>Nenhuma categoria</DropdownMenuItem>
                ) : (
                  categories.map((category) => (
                    <DropdownMenuItem key={category.id} asChild>
                      <Link to={`/categoria/${category.slug}`} className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/grupos"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md hover:bg-muted"
            >
              <MessageCircle className="h-4 w-4" />
              Grupos
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors rounded-md hover:bg-muted"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right side — search (desktop) + hamburger (mobile) */}
          <div className="flex items-center justify-end gap-2">
            {/* Desktop search */}
            <div className="hidden md:flex items-center">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Buscar notícias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                    className="h-9 w-56 rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                  aria-label="Buscar"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Mobile hamburger — always on the right */}
            <button
              className="md:hidden p-2 text-foreground hover:text-primary transition-colors rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 space-y-1">

            {/* Weather + Clock in mobile menu */}
            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 mb-3">
              <span className="text-xs text-muted-foreground tabular-nums">
                🕐 {clockStr}
              </span>
              {weather && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {weather.emoji} {weather.temp}°C · {weather.city}
                </span>
              )}
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar notícias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </form>

            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
            >
              <Home className="h-4 w-4" />
              Início
            </Link>

            {/* Categorias — collapsible */}
            <div>
              <button
                onClick={() => setMobileCatsOpen(!mobileCatsOpen)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Categorias
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${mobileCatsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {mobileCatsOpen && categories.length > 0 && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/categoria/${category.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/grupos"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Grupos de WhatsApp
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-accent hover:text-accent/80 hover:bg-muted rounded-md transition-colors"
              >
                <Shield className="h-4 w-4" />
                Painel Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
