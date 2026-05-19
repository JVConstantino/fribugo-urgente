import http from "node:http";

const PORT = Number(process.env.OG_SERVER_PORT || 4174);
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const APP_URL = process.env.APP_URL || "https://friburgourgente.com.br";
const APP_NAME = "Friburgo Urgente";
const DEFAULT_IMAGE = `${APP_URL}/logo.png`;

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

function coverUrl(coverImageId) {
  if (!SUPABASE_URL || !coverImageId) return DEFAULT_IMAGE;
  return `${SUPABASE_URL}/storage/v1/object/public/covers/${encodeStoragePath(coverImageId)}`;
}

async function fetchArticle(slug) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const params = new URLSearchParams({
    slug: `eq.${slug}`,
    select: "title,excerpt,slug,coverImageId,isPublished",
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
  if (!article || article.isPublished === false) return null;
  return article;
}

function renderArticlePage(article, slug) {
  const canonical = `${APP_URL}/noticias/${encodeURIComponent(article?.slug || slug)}`;
  const title = article?.title ? `${article.title} - ${APP_NAME}` : APP_NAME;
  const description =
    article?.excerpt ||
    "Portal de notícias de Friburgo e região. Informação em tempo real com credibilidade.";
  const image = coverUrl(article?.coverImageId);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="${APP_NAME}">
    <meta property="og:title" content="${escapeHtml(article?.title || APP_NAME)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:image:secure_url" content="${escapeHtml(image)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(article?.title || APP_NAME)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <meta http-equiv="refresh" content="0;url=${escapeHtml(canonical)}">
  </head>
  <body>
    <p><a href="${escapeHtml(canonical)}">Abrir notícia no ${APP_NAME}</a></p>
  </body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const match = url.pathname.match(/^\/noticias\/([^/]+)\/?$/);

    if (!match) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const slug = decodeURIComponent(match[1]);
    const article = await fetchArticle(slug);
    const html = renderArticlePage(article, slug);

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    });
    res.end(html);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Open Graph rendering failed");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Open Graph server listening on 127.0.0.1:${PORT}`);
});
