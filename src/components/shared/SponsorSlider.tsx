import { useEffect, useState } from "react";
import { listAds, incrementAdClick, getFileView } from "@/services/supabase";
import type { Ad } from "@/types";

export function SponsorSlider() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    listAds(true)
      .then((all) => setAds(all.filter((a) => a.format === "leaderboard" && a.imageId)))
      .catch(() => {});
  }, []);

  // Auto-cycle with fade
  useEffect(() => {
    if (ads.length < 2) return;

    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % ads.length);
        setVisible(true);
      }, 500);
    }, 5000);

    return () => clearInterval(id);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const ad = ads[current];

  return (
    <div className="border-t bg-muted/30 py-2 px-4">
      <p className="text-center text-[10px] text-muted-foreground mb-1 tracking-wide uppercase">
        Patrocinado
      </p>

      <div className="flex items-center justify-center gap-3">
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => incrementAdClick(ad.id).catch(() => {})}
          className={`block h-16 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
          title={ad.title}
        >
          <img
            src={getFileView(ad.imageId!)}
            alt={ad.title}
            className="h-full w-auto max-w-[728px] object-contain"
          />
        </a>
      </div>

      {ads.length > 1 && (
        <div className="mt-1 flex justify-center gap-1">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setVisible(false);
                setTimeout(() => {
                  setCurrent(i);
                  setVisible(true);
                }, 300);
              }}
              className={`text-[8px] leading-none transition-colors ${
                i === current ? "text-primary" : "text-muted-foreground/40"
              }`}
              aria-label={`Anúncio ${i + 1}`}
            >
              ●
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
