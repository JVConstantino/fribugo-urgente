import { useEffect, useRef } from "react";

export interface MapPoint {
  label: string;
  lat: number;
  lng: number;
  count: number;
}

interface MapChartProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  title?: string;
}

// Lookup table: cidade → coordenadas
const CITY_COORDS: Record<string, [number, number]> = {
  "Nova Friburgo": [-22.2822, -42.5311],
  "Rio de Janeiro": [-22.9068, -43.1729],
  "São Paulo": [-23.5505, -46.6333],
  "Belo Horizonte": [-19.9167, -43.9345],
  "Brasília": [-15.7801, -47.9292],
  "Salvador": [-12.9714, -38.5014],
  "Fortaleza": [-3.7172, -38.5434],
  "Curitiba": [-25.4284, -49.2733],
  "Manaus": [-3.1190, -60.0217],
  "Recife": [-8.0539, -34.8811],
  "Porto Alegre": [-30.0346, -51.2177],
  "Belém": [-1.4558, -48.5044],
  "Goiânia": [-16.6869, -49.2648],
  "Florianópolis": [-27.5954, -48.5480],
  "Niterói": [-22.8833, -43.1036],
  "Petrópolis": [-22.5050, -43.1789],
  "Campos dos Goytacazes": [-21.7621, -41.3289],
  "Teresópolis": [-22.4125, -42.9672],
  "Macaé": [-22.3699, -41.7869],
  "Cabo Frio": [-22.8878, -42.0186],
  "Volta Redonda": [-22.5231, -44.0999],
  "Angra dos Reis": [-22.9667, -44.3167],
  "São Gonçalo": [-22.8268, -43.0594],
  "Duque de Caxias": [-22.7856, -43.3117],
};

// Bairros de Nova Friburgo com coordenadas aproximadas
const BAIRRO_COORDS: Record<string, [number, number]> = {
  "Centro": [-22.2822, -42.5311],
  "Conselheiro Paulino": [-22.2700, -42.5200],
  "Córrego Dantas": [-22.3100, -42.5400],
  "Campo do Coelho": [-22.3400, -42.5600],
  "São Geraldo": [-22.2600, -42.5500],
  "Olaria": [-22.2900, -42.5100],
  "Duas Pedras": [-22.2650, -42.5450],
  "Cônego": [-22.3200, -42.5700],
  "Riograndina": [-22.2750, -42.5250],
  "Jardim Oasis": [-22.2850, -42.5150],
};

export function resolveCityCoords(city: string): [number, number] | null {
  if (!city) return null;
  const exact = CITY_COORDS[city];
  if (exact) return exact;
  const lower = city.toLowerCase();
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase())) return v;
  }
  return null;
}

export function resolveLocationCoords(location: string): [number, number] | null {
  if (!location) return null;
  const lower = location.toLowerCase();
  for (const [k, v] of Object.entries(BAIRRO_COORDS)) {
    if (lower.includes(k.toLowerCase())) return v;
  }
  // Fallback: Nova Friburgo centro
  if (lower.includes("friburgo") || lower.includes("nova")) return CITY_COORDS["Nova Friburgo"];
  return null;
}

export default function MapChart({ points, center = [-22.2822, -42.5311], zoom = 8, title }: MapChartProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Lazy-load Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView(center, zoom);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const maxCount = Math.max(...points.map((p) => p.count), 1);

      points.forEach((point) => {
        const radius = 8 + (point.count / maxCount) * 24;
        const circle = L.circleMarker([point.lat, point.lng], {
          radius,
          fillColor: "#ef4444",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.6 + (point.count / maxCount) * 0.4,
        }).addTo(map);
        circle.bindPopup(`<strong>${point.label}</strong><br/>${point.count} acesso${point.count !== 1 ? "s" : ""}`);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when points change
  useEffect(() => {
    // Re-initialize handled by key prop in parent
  }, [points]);

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      {title && (
        <div className="px-4 py-2 bg-muted/50 border-b border-border text-sm font-medium">
          {title}
        </div>
      )}
      <div ref={mapRef} style={{ height: 340, width: "100%" }} />
    </div>
  );
}
