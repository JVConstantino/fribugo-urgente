import { Client, Databases, Storage, Account, Query, ID } from "appwrite";
import type { Models } from "appwrite";
import type {
  Article,
  Category,
  Newsletter,
  User,
  CreateArticleData,
  UpdateArticleData,
  CreateCategoryData,
  UpdateCategoryData,
  ArticleFilters,
  Ad,
  CreateAdData,
  UpdateAdData,
  WhatsAppGroup,
  CreateWhatsAppGroupData,
  UpdateWhatsAppGroupData,
  UserNews,
  CreateUserNewsData,
  UpdateUserNewsData,
  AIConfig,
  SaveAIConfigData,
  Popup,
  CreatePopupData,
  UpdatePopupData,
} from "@/types";
import { ITEMS_PER_PAGE } from "@/lib/constants";

// Helper to access dynamic fields on Appwrite documents
type Doc = Models.Document & Record<string, unknown>;

// ===== Environment Variables =====

const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT as string;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID as string;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID as string;
const ARTICLES_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_ARTICLES_COLLECTION_ID as string;
const CATEGORIES_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_CATEGORIES_COLLECTION_ID as string;
const NEWSLETTER_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_NEWSLETTER_COLLECTION_ID as string;
const STORAGE_BUCKET_ID = import.meta.env
  .VITE_APPWRITE_STORAGE_BUCKET_ID as string;
const ADS_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_ADS_COLLECTION_ID as string;
const GROUPS_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_GROUPS_COLLECTION_ID as string;
const USER_NEWS_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_USER_NEWS_COLLECTION_ID as string;
const AI_CONFIG_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_AI_CONFIG_COLLECTION_ID as string;
const SYSTEM_SETTINGS_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_SYSTEM_SETTINGS_COLLECTION_ID as string;
const USER_MEDIA_BUCKET_ID = import.meta.env
  .VITE_APPWRITE_USER_MEDIA_BUCKET_ID as string;
const POPUPS_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_POPUPS_COLLECTION_ID as string;

// ===== Client Initialization =====

const client = new Client();

if (ENDPOINT && PROJECT_ID) {
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);
}

const databases = new Databases(client);
const storage = new Storage(client);
const account = new Account(client);

// ===== Helper: Map Appwrite Document to Domain Type =====

function d(doc: Models.Document): Doc {
  return doc as Doc;
}

// ===== Articles =====

export async function listArticles(
  filters?: ArticleFilters,
  limit: number = ITEMS_PER_PAGE,
  offset: number = 0
): Promise<{ articles: Article[]; total: number }> {
  const queries: string[] = [];

  if (filters?.isPublished !== undefined) {
    queries.push(Query.equal("isPublished", filters.isPublished));
  }

  if (filters?.isBreaking !== undefined) {
    queries.push(Query.equal("isBreaking", filters.isBreaking));
  }

  if (filters?.categoryId) {
    queries.push(Query.equal("categoryId", filters.categoryId));
  }

  if (filters?.search) {
    queries.push(Query.search("title", filters.search));
  }

  queries.push(Query.orderDesc("publishedAt"));
  queries.push(Query.limit(limit));
  queries.push(Query.offset(offset));

  const response = await databases.listDocuments(
    DATABASE_ID,
    ARTICLES_COLLECTION_ID,
    queries
  );

  const articles = response.documents.map((doc) => mapArticle(doc));
  return { articles, total: response.total };
}

export async function getArticle(slug: string): Promise<Article | null> {
  const response = await databases.listDocuments(
    DATABASE_ID,
    ARTICLES_COLLECTION_ID,
    [Query.equal("slug", slug), Query.limit(1)]
  );

  if (response.documents.length === 0) {
    return null;
  }

  return mapArticle(response.documents[0]);
}

export async function getArticleById(id: string): Promise<Article> {
  const doc = await databases.getDocument(
    DATABASE_ID,
    ARTICLES_COLLECTION_ID,
    id
  );
  return mapArticle(doc);
}

export async function createArticle(data: CreateArticleData): Promise<Article> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    ARTICLES_COLLECTION_ID,
    ID.unique(),
    {
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      coverImageId: data.coverImageId,
      categoryId: data.categoryId,
      authorId: data.authorId,
      isBreaking: data.isBreaking,
      isPublished: data.isPublished,
      publishedAt: data.publishedAt,
      views: 0,
      tags: data.tags,
    }
  );
  return mapArticle(doc);
}

export async function updateArticle(
  id: string,
  data: UpdateArticleData
): Promise<Article> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    ARTICLES_COLLECTION_ID,
    id,
    data as Record<string, unknown>
  );
  return mapArticle(doc);
}

export async function deleteArticle(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, ARTICLES_COLLECTION_ID, id);
}

export async function incrementViews(id: string): Promise<void> {
  const article = await getArticleById(id);
  await databases.updateDocument(
    DATABASE_ID,
    ARTICLES_COLLECTION_ID,
    id,
    {
      views: article.views + 1,
    }
  );
}

function mapArticle(raw: Models.Document): Article {
  const doc = d(raw);
  return {
    id: doc.$id,
    title: doc.title as string,
    slug: doc.slug as string,
    content: doc.content as string,
    excerpt: doc.excerpt as string,
    coverImageId: (doc.coverImageId as string) || null,
    categoryId: doc.categoryId as string,
    authorId: doc.authorId as string,
    isBreaking: doc.isBreaking as boolean,
    isPublished: doc.isPublished as boolean,
    publishedAt: doc.publishedAt as string,
    views: doc.views as number,
    tags: (doc.tags as string[]) || [],
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}

/**
 * Full-text search across title (indexed), tags, excerpt and category names.
 * Runs parallel queries, merges and deduplicates results.
 */
export async function searchArticles(
  query: string,
  limit: number = ITEMS_PER_PAGE,
  offset: number = 0
): Promise<{ articles: Article[]; total: number }> {
  const baseQueries = [Query.equal("isPublished", true), Query.limit(100)];

  // Run all searches in parallel — ignore failures from missing indexes
  const [byTitle, byTags, byExcerpt] = await Promise.allSettled([
    databases.listDocuments(DATABASE_ID, ARTICLES_COLLECTION_ID, [
      ...baseQueries,
      Query.search("title", query),
      Query.orderDesc("publishedAt"),
    ]),
    databases.listDocuments(DATABASE_ID, ARTICLES_COLLECTION_ID, [
      ...baseQueries,
      Query.contains("tags", [query.toLowerCase()]),
      Query.orderDesc("publishedAt"),
    ]),
    databases.listDocuments(DATABASE_ID, ARTICLES_COLLECTION_ID, [
      ...baseQueries,
      Query.search("excerpt", query),
      Query.orderDesc("publishedAt"),
    ]),
  ]);

  // Also search category names client-side and fetch matching articles
  let byCategoryArticles: Models.Document[] = [];
  try {
    const cats = await databases.listDocuments(DATABASE_ID, CATEGORIES_COLLECTION_ID, [
      Query.limit(100),
    ]);
    const matchingCatIds = cats.documents
      .filter((c) => (c["name"] as string).toLowerCase().includes(query.toLowerCase()))
      .map((c) => c.$id);

    if (matchingCatIds.length > 0) {
      const catResults = await databases.listDocuments(
        DATABASE_ID,
        ARTICLES_COLLECTION_ID,
        [
          Query.equal("isPublished", true),
          Query.equal("categoryId", matchingCatIds),
          Query.orderDesc("publishedAt"),
          Query.limit(100),
        ]
      );
      byCategoryArticles = catResults.documents;
    }
  } catch {
    // ignore
  }

  // Merge and deduplicate by $id
  const seen = new Set<string>();
  const merged: Article[] = [];

  const allDocs = [
    ...(byTitle.status === "fulfilled" ? byTitle.value.documents : []),
    ...(byTags.status === "fulfilled" ? byTags.value.documents : []),
    ...(byExcerpt.status === "fulfilled" ? byExcerpt.value.documents : []),
    ...byCategoryArticles,
  ];

  for (const doc of allDocs) {
    if (!seen.has(doc.$id)) {
      seen.add(doc.$id);
      merged.push(mapArticle(doc));
    }
  }

  // Sort by publishedAt descending
  merged.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const total = merged.length;
  return { articles: merged.slice(offset, offset + limit), total };
}

export async function getMostViewedArticles(limit: number = 5): Promise<Article[]> {
  const response = await databases.listDocuments(
    DATABASE_ID,
    ARTICLES_COLLECTION_ID,
    [
      Query.equal("isPublished", true),
      Query.orderDesc("views"),
      Query.limit(limit),
    ]
  );
  return response.documents.map(mapArticle);
}

// ===== Categories =====

export async function listCategories(): Promise<Category[]> {
  const response = await databases.listDocuments(
    DATABASE_ID,
    CATEGORIES_COLLECTION_ID,
    [Query.orderAsc("sortOrder")]
  );

  return response.documents.map(mapCategory);
}

export async function getCategory(slug: string): Promise<Category | null> {
  const response = await databases.listDocuments(
    DATABASE_ID,
    CATEGORIES_COLLECTION_ID,
    [Query.equal("slug", slug), Query.limit(1)]
  );

  if (response.documents.length === 0) {
    return null;
  }

  return mapCategory(response.documents[0]);
}

export async function createCategory(
  data: CreateCategoryData
): Promise<Category> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    CATEGORIES_COLLECTION_ID,
    ID.unique(),
    {
      name: data.name,
      slug: data.slug,
      color: data.color,
      icon: data.icon,
      sortOrder: data.sortOrder,
    }
  );
  return mapCategory(doc);
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryData
): Promise<Category> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    CATEGORIES_COLLECTION_ID,
    id,
    data as Record<string, unknown>
  );
  return mapCategory(doc);
}

export async function deleteCategory(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, CATEGORIES_COLLECTION_ID, id);
}

function mapCategory(raw: Models.Document): Category {
  const doc = d(raw);
  return {
    id: doc.$id,
    name: doc.name as string,
    slug: doc.slug as string,
    color: doc.color as string,
    icon: (doc.icon as string) || "",
    sortOrder: doc.sortOrder as number,
  };
}

// ===== Newsletter =====

export async function subscribe(email: string): Promise<Newsletter> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    NEWSLETTER_COLLECTION_ID,
    ID.unique(),
    {
      email,
      isActive: true,
      subscribedAt: new Date().toISOString(),
    }
  );
  return mapNewsletter(doc);
}

export async function unsubscribe(id: string): Promise<void> {
  await databases.updateDocument(
    DATABASE_ID,
    NEWSLETTER_COLLECTION_ID,
    id,
    { isActive: false }
  );
}

function mapNewsletter(raw: Models.Document): Newsletter {
  const doc = d(raw);
  return {
    id: doc.$id,
    email: doc.email as string,
    subscribedAt: (doc.subscribedAt as string) || doc.$createdAt,
    isActive: doc.isActive as boolean,
  };
}

// ===== Auth =====

export async function login(
  email: string,
  password: string
): Promise<Models.Session> {
  return account.createEmailPasswordSession(email, password);
}

export async function logout(): Promise<void> {
  try {
    await account.deleteSession("current");
  } catch {
    // No active session to delete
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const user = await account.get();
    return {
      id: user.$id,
      name: user.name,
      email: user.email,
    };
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  try {
    const user = await account.get();
    // Check if user has the "admin" label in their preferences
    // or use a custom claim. Adjust this logic based on your Appwrite setup.
    const prefs = user.prefs as Record<string, unknown>;
    return prefs.role === "admin";
  } catch {
    return false;
  }
}

// ===== Storage =====

export async function uploadFile(file: File): Promise<Models.File> {
  return storage.createFile(STORAGE_BUCKET_ID, ID.unique(), file);
}

export async function listFiles(): Promise<Models.FileList> {
  return storage.listFiles(STORAGE_BUCKET_ID);
}

export function getFilePreview(fileId: string): string {
  const result = storage.getFilePreview(STORAGE_BUCKET_ID, fileId);
  return typeof result === "string" ? result : (result as { href: string }).href;
}

export function getFileView(fileId: string): string {
  const result = storage.getFileView(STORAGE_BUCKET_ID, fileId);
  return typeof result === "string" ? result : (result as { href: string }).href;
}

export async function deleteFile(fileId: string): Promise<void> {
  await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
}

// ===== Helpers =====

/**
 * Get the full URL for an article's cover image.
 * Returns null if the article has no cover image.
 */
export function getArticleCoverUrl(article: Article): string | null {
  if (!article.coverImageId) return null;
  return getFileView(article.coverImageId);
}

// ===== Ads =====

export async function listAds(onlyActive?: boolean): Promise<Ad[]> {
  const queries: string[] = [Query.orderDesc("$createdAt"), Query.limit(100)];
  if (onlyActive) {
    // Only filter isActive in Appwrite (datetime fields require indexes)
    // Date range is checked client-side below
    queries.push(Query.equal("isActive", true));
  }
  const response = await databases.listDocuments(
    DATABASE_ID,
    ADS_COLLECTION_ID,
    queries
  );
  let ads = response.documents.map(mapAd);
  if (onlyActive) {
    const now = new Date();
    ads = ads.filter(
      (a) => new Date(a.startsAt) <= now && new Date(a.endsAt) >= now
    );
  }
  return ads;
}

export async function getAdById(id: string): Promise<Ad> {
  const doc = await databases.getDocument(DATABASE_ID, ADS_COLLECTION_ID, id);
  return mapAd(doc);
}

export async function createAd(data: CreateAdData): Promise<Ad> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    ADS_COLLECTION_ID,
    ID.unique(),
    {
      title: data.title,
      imageId: data.imageId,
      linkUrl: data.linkUrl,
      format: data.format,
      pages: data.pages,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      isActive: data.isActive,
      dailyLimit: data.dailyLimit ?? null,
      impressions: 0,
      clicks: 0,
    }
  );
  return mapAd(doc);
}

export async function updateAd(id: string, data: UpdateAdData): Promise<Ad> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    ADS_COLLECTION_ID,
    id,
    data as Record<string, unknown>
  );
  return mapAd(doc);
}

export async function deleteAd(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, ADS_COLLECTION_ID, id);
}

export async function incrementAdImpression(id: string): Promise<void> {
  const ad = await getAdById(id);
  await databases.updateDocument(DATABASE_ID, ADS_COLLECTION_ID, id, {
    impressions: ad.impressions + 1,
  });
}

export async function incrementAdClick(id: string): Promise<void> {
  const ad = await getAdById(id);
  await databases.updateDocument(DATABASE_ID, ADS_COLLECTION_ID, id, {
    clicks: ad.clicks + 1,
  });
}

function mapAd(raw: Models.Document): Ad {
  const doc = d(raw);
  return {
    id: doc.$id,
    title: doc.title as string,
    imageId: (doc.imageId as string) || null,
    linkUrl: doc.linkUrl as string,
    format: doc.format as Ad["format"],
    pages: (doc.pages as Ad["pages"]) || [],
    startsAt: doc.startsAt as string,
    endsAt: doc.endsAt as string,
    isActive: doc.isActive as boolean,
    impressions: (doc.impressions as number) || 0,
    clicks: (doc.clicks as number) || 0,
    dailyLimit: (doc.dailyLimit as number) ?? null,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}

// ===== WhatsApp Groups =====

export async function listGroups(onlyActive?: boolean): Promise<WhatsAppGroup[]> {
  const queries: string[] = [Query.orderAsc("sortOrder"), Query.limit(100)];
  if (onlyActive) queries.push(Query.equal("isActive", true));
  const response = await databases.listDocuments(
    DATABASE_ID,
    GROUPS_COLLECTION_ID,
    queries
  );
  return response.documents.map(mapGroup);
}

export async function createGroup(data: CreateWhatsAppGroupData): Promise<WhatsAppGroup> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    GROUPS_COLLECTION_ID,
    ID.unique(),
    {
      title: data.title,
      description: data.description,
      link: data.link,
      category: data.category,
      imageId: data.imageId,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    }
  );
  return mapGroup(doc);
}

export async function updateGroup(
  id: string,
  data: UpdateWhatsAppGroupData
): Promise<WhatsAppGroup> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    GROUPS_COLLECTION_ID,
    id,
    data as Record<string, unknown>
  );
  return mapGroup(doc);
}

export async function deleteGroup(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, GROUPS_COLLECTION_ID, id);
}

function mapGroup(raw: Models.Document): WhatsAppGroup {
  const doc = d(raw);
  return {
    id: doc.$id,
    title: doc.title as string,
    description: (doc.description as string) || "",
    link: doc.link as string,
    category: (doc.category as string) || "",
    imageId: (doc.imageId as string) || null,
    isActive: (doc.isActive as boolean) ?? true,
    sortOrder: (doc.sortOrder as number) || 0,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}

// ===== Re-export SDK utilities =====

export { client, databases, storage, account, Query, ID };

// ===== User News (notícias enviadas por internautas) =====

export async function listUserNews(status?: string): Promise<UserNews[]> {
  const queries: string[] = [Query.orderDesc("$createdAt")];
  if (status) queries.push(Query.equal("status", status));
  const res = await databases.listDocuments(DATABASE_ID, USER_NEWS_COLLECTION_ID, queries);
  return res.documents.map(mapUserNews);
}

export async function getUserNewsById(id: string): Promise<UserNews> {
  const doc = await databases.getDocument(DATABASE_ID, USER_NEWS_COLLECTION_ID, id);
  return mapUserNews(doc);
}

export async function createUserNews(data: CreateUserNewsData): Promise<UserNews> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    USER_NEWS_COLLECTION_ID,
    ID.unique(),
    {
      title: data.title,
      categoryId: data.categoryId,
      description: data.description,
      location: data.location,
      whatHappened: data.whatHappened,
      mediaIds: data.mediaIds,
      authorName: data.authorName,
      authorPhone: data.authorPhone,
      authorEmail: data.authorEmail,
      status: "pending",
      aiSummary: null,
      aiCategory: null,
      aiAnalysis: null,
      adminNotes: null,
    }
  );
  return mapUserNews(doc);
}

export async function updateUserNews(id: string, data: UpdateUserNewsData): Promise<UserNews> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    USER_NEWS_COLLECTION_ID,
    id,
    data as Record<string, unknown>
  );
  return mapUserNews(doc);
}

export async function deleteUserNews(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, USER_NEWS_COLLECTION_ID, id);
}

function mapUserNews(raw: Models.Document): UserNews {
  const doc = d(raw);
  return {
    id: doc.$id,
    title: doc.title as string,
    categoryId: (doc.categoryId as string) || null,
    description: doc.description as string,
    location: (doc.location as string) || "",
    whatHappened: (doc.whatHappened as string) || "",
    mediaIds: (doc.mediaIds as string[]) || [],
    authorName: doc.authorName as string,
    authorPhone: doc.authorPhone as string,
    authorEmail: doc.authorEmail as string,
    status: (doc.status as UserNews["status"]) || "pending",
    aiSummary: (doc.aiSummary as string) || null,
    aiCategory: (doc.aiCategory as string) || null,
    aiAnalysis: (doc.aiAnalysis as string) || null,
    adminNotes: (doc.adminNotes as string) || null,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}

// ===== AI Config =====

export async function getAIConfig(): Promise<AIConfig | null> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, AI_CONFIG_COLLECTION_ID, [Query.limit(1)]);
    if (res.documents.length === 0) return null;
    return mapAIConfig(res.documents[0]);
  } catch {
    return null;
  }
}

export async function saveAIConfig(data: SaveAIConfigData): Promise<AIConfig> {
  const existing = await getAIConfig();
  if (existing) {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      AI_CONFIG_COLLECTION_ID,
      existing.id,
      data as unknown as Record<string, unknown>
    );
    return mapAIConfig(doc);
  }
  const doc = await databases.createDocument(
    DATABASE_ID,
    AI_CONFIG_COLLECTION_ID,
    ID.unique(),
    data as unknown as Record<string, unknown>
  );
  return mapAIConfig(doc);
}

function mapAIConfig(raw: Models.Document): AIConfig {
  const doc = d(raw);
  return {
    id: doc.$id,
    provider: (doc.provider as string) || "openrouter",
    apiKey: (doc.apiKey as string) || "",
    endpoint: (doc.endpoint as string) || "https://openrouter.ai/api/v1",
    model: (doc.model as string) || "",
    systemPrompt: (doc.systemPrompt as string) || "",
    isActive: (doc.isActive as boolean) ?? true,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}

// ===== System Settings =====

export async function getSetting(key: string): Promise<string | null> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, SYSTEM_SETTINGS_COLLECTION_ID, [
      Query.equal("key", key),
      Query.limit(1),
    ]);
    if (res.documents.length === 0) return null;
    return (res.documents[0].value as string) || null;
  } catch {
    return null;
  }
}

export async function saveSetting(key: string, value: string): Promise<void> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, SYSTEM_SETTINGS_COLLECTION_ID, [
      Query.equal("key", key),
      Query.limit(1),
    ]);
    if (res.documents.length > 0) {
      await databases.updateDocument(DATABASE_ID, SYSTEM_SETTINGS_COLLECTION_ID, res.documents[0].$id, { value });
    } else {
      await databases.createDocument(DATABASE_ID, SYSTEM_SETTINGS_COLLECTION_ID, ID.unique(), { key, value });
    }
  } catch (err: unknown) {
    try {
      await databases.createDocument(DATABASE_ID, SYSTEM_SETTINGS_COLLECTION_ID, ID.unique(), { key, value });
    } catch {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      throw new Error(`Erro ao salvar configuração: ${message}. Verifique se a collection "${SYSTEM_SETTINGS_COLLECTION_ID}" existe no Appwrite.`);
    }
  }
}

// ===== User Media Upload (separate bucket) =====

export async function uploadUserMedia(file: File): Promise<Models.File> {
  return storage.createFile(USER_MEDIA_BUCKET_ID, ID.unique(), file);
}

export async function deleteUserMedia(fileId: string): Promise<void> {
  await storage.deleteFile(USER_MEDIA_BUCKET_ID, fileId);
}

export function getUserMediaView(fileId: string): string {
  return storage.getFileView(USER_MEDIA_BUCKET_ID, fileId);
}

// ===== Popups =====

export async function listPopups(onlyActive?: boolean): Promise<Popup[]> {
  const queries: string[] = [Query.orderDesc("$createdAt")];
  if (onlyActive) queries.push(Query.equal("isActive", true));
  const response = await databases.listDocuments(DATABASE_ID, POPUPS_COLLECTION_ID, queries);
  let popups = response.documents.map(mapPopup);
  if (onlyActive) {
    const now = new Date();
    popups = popups.filter((p) => new Date(p.startsAt) <= now && new Date(p.endsAt) >= now);
  }
  return popups;
}

export async function getPopupById(id: string): Promise<Popup> {
  const doc = await databases.getDocument(DATABASE_ID, POPUPS_COLLECTION_ID, id);
  return mapPopup(doc);
}

export async function createPopup(data: CreatePopupData): Promise<Popup> {
  const doc = await databases.createDocument(DATABASE_ID, POPUPS_COLLECTION_ID, ID.unique(), {
    title: data.title,
    type: data.type,
    imageId: data.imageId,
    linkUrl: data.linkUrl,
    groupId: data.groupId,
    heading: data.heading,
    description: data.description,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    isActive: data.isActive,
    impressions: 0,
    clicks: 0,
  });
  return mapPopup(doc);
}

export async function updatePopup(id: string, data: UpdatePopupData): Promise<Popup> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    POPUPS_COLLECTION_ID,
    id,
    data as Record<string, unknown>
  );
  return mapPopup(doc);
}

export async function deletePopup(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, POPUPS_COLLECTION_ID, id);
}

export async function incrementPopupImpression(id: string): Promise<void> {
  const popup = await getPopupById(id);
  await databases.updateDocument(DATABASE_ID, POPUPS_COLLECTION_ID, id, {
    impressions: popup.impressions + 1,
  });
}

export async function incrementPopupClick(id: string): Promise<void> {
  const popup = await getPopupById(id);
  await databases.updateDocument(DATABASE_ID, POPUPS_COLLECTION_ID, id, {
    clicks: popup.clicks + 1,
  });
}

function mapPopup(raw: Models.Document): Popup {
  const doc = d(raw);
  return {
    id: doc.$id,
    title: doc.title as string,
    type: (doc.type as "image" | "group") || "image",
    imageId: (doc.imageId as string) || null,
    linkUrl: (doc.linkUrl as string) || null,
    groupId: (doc.groupId as string) || null,
    heading: (doc.heading as string) || null,
    description: (doc.description as string) || null,
    startsAt: doc.startsAt as string,
    endsAt: doc.endsAt as string,
    isActive: (doc.isActive as boolean) ?? true,
    impressions: (doc.impressions as number) || 0,
    clicks: (doc.clicks as number) || 0,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}