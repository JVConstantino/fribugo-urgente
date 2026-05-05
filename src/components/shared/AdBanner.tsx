import { useEffect, useState, useRef, useCallback } from "react";
import { listAds, incrementAdImpression, incrementAdClick, getFileView } from "@/services/supabase";
import type { Ad, AdFormat, AdPage } from "@/types";

// ── Daily impression tracking ──────────────────────────────────────────────

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyImpressions(adId: string): number {
  try {
    const key = `ad_imp_${adId}_${getTodayKey()}`;
    return parseInt(localStorage.getItem(key) || "0", 10);
  } catch {
    return 0;
  }
}

function trackDailyImpression(adId: string): void {
  try {
    const key = `ad_imp_${adId}_${getTodayKey()}`;
    const current = getDailyImpressions(adId);
    localStorage.setItem(key, String(current + 1));
  } catch {
    // localStorage unavailable
  }
}

function hasReachedDailyLimit(ad: Ad): boolean {
  if (!ad.dailyLimit || ad.dailyLimit <= 0) return false;
  return getDailyImpressions(ad.id) >= ad.dailyLimit;
}

interface AdBannerProps {
  page: AdPage;
  format: AdFormat;
  className?: string;
  maxCount?: number;
}

const FORMAT_DIMENSIONS: Record<AdFormat, { width: number; height: number; containerClass?: string; imgClass?: string }> = {
  leaderboard: { width: 728, height: 90, containerClass: "mx-auto max-w-[728px]", imgClass: "h-[90px]" },
  banner: { width: 468, height: 60, containerClass: "mx-auto max-w-[468px]", imgClass: "h-[60px]" },
  sidebar: { width: 300, height: 250, containerClass: "w-full max-w-[300px] mx-auto", imgClass: "w-full aspect-[300/250]" },
  square: { width: 250, height: 250, containerClass: "w-full max-w-[250px] mx-auto", imgClass: "w-full aspect-square" },
};

function AdItem({ ad, format, onImpression }: { ad: Ad; format: AdFormat; onImpression: (id: string) => void }) {
  const recorded = useRef(false);

  useEffect(() => {
    if (!recorded.current) {
      recorded.current = true;
      onImpression(ad.id);
    }
  }, [ad.id, onImpression]);

  const handleClick = useCallback(() => {
    incrementAdClick(ad.id).catch(() => {});
  }, [ad.id]);

  if (!ad.imageId) return null;

  const dims = FORMAT_DIMENSIONS[format];
  const isHorizontal = format === "banner" || format === "leaderboard";
  const labelAlign = isHorizontal ? "text-center mb-0.5" : "text-right mb-0.5";

  return (
    <div>
      <p className={`text-[10px] text-muted-foreground ${labelAlign} uppercase tracking-wide leading-none`}>
        Patrocinado
      </p>
      <div className={dims.containerClass}>
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="block overflow-hidden rounded-md"
          title={ad.title}
        >
          <img
            src={getFileView(ad.imageId)}
            alt={ad.title}
            className={`w-full object-cover ${dims.imgClass}`}
            loading="lazy"
          />
        </a>
      </div>
    </div>
  );
}

export function AdBanner({ page, format, className, maxCount = 1 }: AdBannerProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const allAds = await listAds(true);
        const matching = allAds.filter(
          (a) =>
            a.format === format &&
            (a.pages.includes(page) || a.pages.includes("all")) &&
            !hasReachedDailyLimit(a)
        );
        // Shuffle and take up to maxCount (random rotation on each page load)
        const shuffled = [...matching].sort(() => Math.random() - 0.5);
        if (!cancelled) setAds(shuffled.slice(0, maxCount));
      } catch {
        // ignore — no ads is fine
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [page, format, maxCount]);

  const handleImpression = useCallback((id: string) => {
    trackDailyImpression(id);
    incrementAdImpression(id).catch(() => {});
  }, []);

  if (loading || ads.length === 0) return null;

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      {ads.map((ad) => (
        <AdItem key={ad.id} ad={ad} format={format} onImpression={handleImpression} />
      ))}
    </div>
  );
}
