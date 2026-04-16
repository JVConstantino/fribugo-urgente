export const APP_NAME = "Friburgo Urgente";

export const APP_DESCRIPTION =
  "Portal de notícias de Friburgo e região. Informação em tempo real com credibilidade.";

export const APP_URL = "https://friburgourgente.com.br";

export const DEFAULT_CATEGORY_COLORS = [
  "#dc2626", // red
  "#2563eb", // blue
  "#16a34a", // green
  "#9333ea", // purple
  "#ea580c", // orange
  "#0891b2", // cyan
  "#ca8a04", // yellow
  "#4f46e5", // indigo
  "#db2777", // pink
  "#65a30d", // lime
];

export const ITEMS_PER_PAGE = 12;

/** Speed of the breaking news ticker in seconds */
export const BREAKING_TICKER_SPEED = 30;

/** Maximum file upload size in bytes (5 MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Allowed image MIME types for cover uploads */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/** Number of trending articles to display */
export const TRENDING_ARTICLES_COUNT = 5;

/** Number of related articles to display */
export const RELATED_ARTICLES_COUNT = 4;

/** Regex pattern for slug validation */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;