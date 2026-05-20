import http from "node:http";
import { readFile } from "node:fs/promises";

const PORT = Number(process.env.OG_SERVER_PORT || 4174);
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const APP_URL = process.env.APP_URL || "https://friburgourgente.com.br";
const APP_NAME = "Friburgo Urgente";
const DEFAULT_IMAGE = `${APP_URL}/logo.png`;
const SPA_INDEX_PATH = process.env.SPA_INDEX_PATH || "/srv/index.html";
const ARTICLE_CACHE_TTL_MS = 60 * 1000;
const articleCache = new Map();
const SOCIAL_BOT_RE =
  /(facebookexternalhit|facebookexternalbot|facebot|whatsapp|telegrambot|twitterbot|linkedinbot|googlebot|slackbot|discordbot)/i;

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function encodeStoragePath(path) {
  return String(path)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function storageUrl(fileId, defaultBucket = "covers") {
  if (!SUPABASE_URL || !fileId) return "";
  const knownBuckets = ["article_videos", "user_media", "covers"];
  const slashIndex = String(fileId).indexOf("/");
  let bucket = defaultBucket;
  let path = String(fileId);

  if (slashIndex > 0) {
    const possibleBucket = String(fileId).slice(0, slashIndex);
    if (knownBuckets.includes(possibleBucket)) {
      bucket = possibleBucket;
      path = String(fileId).slice(slashIndex + 1);
    }
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeStoragePath(path)}`;
}

function isGeneratedVideoThumbnail(fileId) {
  return Boolean(fileId && String(fileId).includes("auto-video-thumbnail-"));
}

function articleImage(article, pageType) {
  if (!article) return DEFAULT_IMAGE;

  if (pageType === "video") {
    if (article.videoThumbnailImageId && !isGeneratedVideoThumbnail(article.videoThumbnailImageId)) {
      return storageUrl(article.videoThumbnailImageId, "covers");
    }
    if (article.coverImageId) return storageUrl(article.coverImageId, "covers");
    if (article.videoThumbnailImageId) return storageUrl(article.videoThumbnailImageId, "covers");
    return DEFAULT_IMAGE;
  }

  if (article.coverImageId) return storageUrl(article.coverImageId, "covers");
  return DEFAULT_IMAGE;
}

function isSocialBot(req) {
  return SOCIAL_BOT_RE.test(req.headers["user-agent"] || "");
}

async function renderSpaIndex() {
  return readFile(SPA_INDEX_PATH, "utf8");
}

async function fetchArticle(slug) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const cached = articleCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.article;
  }

  const params = new URLSearchParams({
    slug: `eq.${slug}`,
    select: "title,excerpt,slug,coverImageId,videoThumbnailImageId,videoFileId,isPublished",
    limit: "1",
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/articles?${params}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) return null;
  const rows = await response.json();
  const article = rows?.[0];
  if (!article || article.isPublished === false) {
    articleCache.set(slug, { article: null, expiresAt: Date.now() + ARTICLE_CACHE_TTL_MS });
    return null;
  }
  articleCache.set(slug, { article, expiresAt: Date.now() + ARTICLE_CACHE_TTL_MS });
  return article;
}

function renderArticlePage(article, slug, pageType = "article") {
  const pathPrefix = pageType === "video" ? "videos" : "noticias";
  const canonical = `${APP_URL}/${pathPrefix}/${encodeURIComponent(article?.slug || slug)}`;
  const title = article?.title ? `${article.title} - ${APP_NAME}` : APP_NAME;
  const description =
    article?.excerpt ||
    "Portal de noticias de Friburgo e regiao. Informacao em tempo real com credibilidade.";
  const image = articleImage(article, pageType);
  const ogType = pageType === "video" ? "video.other" : "article";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="${APP_NAME}">
    <meta property="og:title" content="${escapeHtml(article?.title || APP_NAME)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:image:secure_url" content="${escapeHtml(image)}">
    <meta property="og:image:alt" content="${escapeHtml(article?.title || APP_NAME)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(article?.title || APP_NAME)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <meta http-equiv="refresh" content="0;url=${escapeHtml(canonical)}">
  </head>
  <body>
    <p><a href="${escapeHtml(canonical)}">Abrir no ${APP_NAME}</a></p>
  </body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const match = url.pathname.match(/^\/(noticias|videos)\/([^/]+)\/?$/);

    if (!match) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const pageType = match[1] === "videos" ? "video" : "article";
    const slug = decodeURIComponent(match[2]);

    if (!isSocialBot(req)) {
      const html = await renderSpaIndex();
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      });
      res.end(html);
      return;
    }

    const article = await fetchArticle(slug);
    if (!article) {
      const html = await renderSpaIndex();
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      });
      res.end(html);
      return;
    }

    const html = renderArticlePage(article, slug, pageType);

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    });
    res.end(html);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Open Graph rendering failed");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Open Graph server listening on 127.0.0.1:${PORT}`);
});
