import { useEffect, useState, useRef, useCallback } from "react";
import { listAds, incrementAdImpression, incrementAdClick, getFileView } from "@/services/appwrite";
import type { Ad, AdFormat, AdPage } from "@/types";

interface AdBannerProps {
  page: AdPage;
  format: AdFormat;
  className?: string;
  /** Sidebar only: show up to this many stacked ads (default 1) */
  maxCount?: number;
}

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

  if (format === "banner") {
    return (
      <div>
        <p className="text-[10px] text-muted-foreground text-center mb-0.5 uppercase tracking-wide leading-none">
          Patrocinado
        </p>
        <div className="mx-auto max-w-[468px]">
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="block overflow-hidden rounded border border-border"
            title={ad.title}
          >
            <img
              src={getFileView(ad.imageId)}
              alt={ad.title}
              className="w-full h-[60px] object-cover"
              loading="lazy"
            />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] text-muted-foreground text-right mb-0.5 uppercase tracking-wide leading-none">
        Patrocinado
      </p>
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
          className="w-full h-auto object-cover"
          loading="lazy"
        />
      </a>
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
          (a) => a.format === format && (a.pages.includes(page) || a.pages.includes("all"))
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
