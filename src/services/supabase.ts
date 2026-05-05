import { createClient } from '@supabase/supabase-js';
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
} from '@/types';
import { ITEMS_PER_PAGE } from '@/lib/constants';

// ===== Environment Variables =====

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ===== Client Initialization =====

const supabase = createClient<any>(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Helpers =====

function generateId(): string {
  return crypto.randomUUID();
}

// ===== Articles =====

export async function listArticles(
  filters?: ArticleFilters,
  limit: number = ITEMS_PER_PAGE,
  offset: number = 0
): Promise<{ articles: Article[]; total: number }> {
  let query = supabase.from('articles').select('*', { count: 'exact' });

  if (filters?.isPublished !== undefined) {
    query = query.eq('isPublished', filters.isPublished);
  }

  if (filters?.isBreaking !== undefined) {
    query = query.eq('isBreaking', filters.isBreaking);
  }

  if (filters?.categoryId) {
    query = query.eq('categoryId', filters.categoryId);
  }

  query = query.order('publishedAt', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    articles: (data || []).map(mapArticle),
    total: count || 0,
  };
}

export async function getArticle(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error?.code === 'PGRST116') return null; // Not found
  if (error) throw error;

  return mapArticle(data);
}

export async function getArticleById(id: string): Promise<Article> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapArticle(data);
}

export async function createArticle(data: CreateArticleData): Promise<Article> {
  const { data: record, error } = await supabase
    .from('articles')
    .insert({
      id: generateId(),
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
    })
    .select()
    .single();

  if (error) throw error;
  return mapArticle(record);
}

export async function updateArticle(id: string, data: UpdateArticleData): Promise<Article> {
  const { data: record, error } = await supabase
    .from('articles')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapArticle(record);
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementViews(id: string): Promise<void> {
  const article = await getArticleById(id);
  const { error } = await supabase
    .from('articles')
    .update({ views: article.views + 1 })
    .eq('id', id);
  if (error) throw error;
}

function mapArticle(raw: any): Article {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    content: raw.content,
    excerpt: raw.excerpt,
    coverImageId: raw.coverImageId || null,
    categoryId: raw.categoryId,
    authorId: raw.authorId,
    isBreaking: raw.isBreaking,
    isPublished: raw.isPublished,
    publishedAt: raw.publishedAt,
    views: raw.views,
    tags: raw.tags || [],
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export async function searchArticles(
  query: string,
  limit: number = ITEMS_PER_PAGE,
  offset: number = 0
): Promise<{ articles: Article[]; total: number }> {
  // Simple search across title, tags, excerpt
  const searchTerm = `%${query.toLowerCase()}%`;

  const { data, error, count } = await supabase
    .from('articles')
    .select('*', { count: 'exact' })
    .eq('isPublished', true)
    .or(
      `title.ilike.${searchTerm},excerpt.ilike.${searchTerm},tags.cs.{${query.toLowerCase()}}`
    )
    .order('publishedAt', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    articles: (data || []).map(mapArticle),
    total: count || 0,
  };
}

export async function getMostViewedArticles(limit: number = 5): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('isPublished', true)
    .order('views', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(mapArticle);
}

// ===== Categories =====

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sortOrder', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapCategory);
}

export async function getCategory(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return mapCategory(data);
}

export async function createCategory(data: CreateCategoryData): Promise<Category> {
  const { data: record, error } = await supabase
    .from('categories')
    .insert({
      id: generateId(),
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return mapCategory(record);
}

export async function updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
  const { data: record, error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapCategory(record);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

function mapCategory(raw: any): Category {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    color: raw.color,
    icon: raw.icon || '',
    sortOrder: raw.sortOrder,
  };
}

// ===== Newsletter =====

export async function subscribe(email: string): Promise<Newsletter> {
  const { data, error } = await supabase
    .from('newsletter')
    .insert({
      id: generateId(),
      email,
      isActive: true,
      subscribedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapNewsletter(data);
}

export async function unsubscribe(id: string): Promise<void> {
  const { error } = await supabase
    .from('newsletter')
    .update({ isActive: false })
    .eq('id', id);
  if (error) throw error;
}

function mapNewsletter(raw: any): Newsletter {
  return {
    id: raw.id,
    email: raw.email,
    subscribedAt: raw.subscribedAt,
    isActive: raw.isActive,
  };
}

// ===== Auth =====

export async function login(email: string, password: string): Promise<any> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  const user = data.user;
  return {
    id: user.id,
    name: user.user_metadata?.name || user.email || '',
    email: user.email || '',
  };
}

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return false;

  // Check if user is admin via metadata or role
  return data.user.user_metadata?.role === 'admin' || data.user.role === 'service_role';
}

// ===== Storage =====

export async function uploadFile(file: File): Promise<any> {
  const filename = `${generateId()}_${file.name}`;
  const { data, error } = await supabase.storage.from('covers').upload(filename, file);

  if (error) throw error;
  return { $id: data.path };
}

export async function listFiles(): Promise<any> {
  const { data, error } = await supabase.storage.from('covers').list();

  if (error) throw error;
  return {
    files: (data || []).map((file) => ({
      $id: file.name,
      name: file.name,
      $createdAt: file.created_at || new Date().toISOString(),
    })),
  };
}

export function getFilePreview(fileId: string): string {
  const { data } = supabase.storage.from('covers').getPublicUrl(fileId);
  return data?.publicUrl || '';
}

export function getFileView(fileId: string): string {
  const { data } = supabase.storage.from('covers').getPublicUrl(fileId);
  return data?.publicUrl || '';
}

export async function deleteFile(fileId: string): Promise<void> {
  const { error } = await supabase.storage.from('covers').remove([fileId]);
  if (error) throw error;
}

export function getArticleCoverUrl(article: Article): string | null {
  if (!article.coverImageId) return null;
  return getFileView(article.coverImageId);
}

// ===== Ads =====

export async function listAds(onlyActive?: boolean): Promise<Ad[]> {
  let query = supabase.from('ads').select('*').order('created_at', { ascending: false });

  if (onlyActive) {
    query = query.eq('isActive', true);
    const { data, error } = await query;
    if (error) throw error;

    const now = new Date();
    return (data || [])
      .filter((a) => new Date(a.startsAt) <= now && new Date(a.endsAt) >= now)
      .map(mapAd);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapAd);
}

export async function getAdById(id: string): Promise<Ad> {
  const { data, error } = await supabase.from('ads').select('*').eq('id', id).single();
  if (error) throw error;
  return mapAd(data);
}

export async function createAd(data: CreateAdData): Promise<Ad> {
  const { data: record, error } = await supabase
    .from('ads')
    .insert({
      id: generateId(),
      ...data,
      impressions: 0,
      clicks: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return mapAd(record);
}

export async function updateAd(id: string, data: UpdateAdData): Promise<Ad> {
  const { data: record, error } = await supabase
    .from('ads')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapAd(record);
}

export async function deleteAd(id: string): Promise<void> {
  const { error } = await supabase.from('ads').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementAdImpression(id: string): Promise<void> {
  const ad = await getAdById(id);
  const { error } = await supabase
    .from('ads')
    .update({ impressions: ad.impressions + 1 })
    .eq('id', id);
  if (error) throw error;
}

export async function incrementAdClick(id: string): Promise<void> {
  const ad = await getAdById(id);
  const { error } = await supabase
    .from('ads')
    .update({ clicks: ad.clicks + 1 })
    .eq('id', id);
  if (error) throw error;
}

function mapAd(raw: any): Ad {
  return {
    id: raw.id,
    title: raw.title,
    imageId: raw.imageId || null,
    linkUrl: raw.linkUrl,
    format: raw.format,
    pages: raw.pages || [],
    startsAt: raw.startsAt,
    endsAt: raw.endsAt,
    isActive: raw.isActive,
    impressions: raw.impressions || 0,
    clicks: raw.clicks || 0,
    dailyLimit: raw.dailyLimit || null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ===== WhatsApp Groups =====

export async function listGroups(onlyActive?: boolean): Promise<WhatsAppGroup[]> {
  let query = supabase.from('whatsapp_groups').select('*').order('sortOrder', { ascending: true });

  if (onlyActive) {
    query = query.eq('isActive', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapGroup);
}

export async function createGroup(data: CreateWhatsAppGroupData): Promise<WhatsAppGroup> {
  const { data: record, error } = await supabase
    .from('whatsapp_groups')
    .insert({
      id: generateId(),
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return mapGroup(record);
}

export async function updateGroup(
  id: string,
  data: UpdateWhatsAppGroupData
): Promise<WhatsAppGroup> {
  const { data: record, error } = await supabase
    .from('whatsapp_groups')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapGroup(record);
}

export async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase.from('whatsapp_groups').delete().eq('id', id);
  if (error) throw error;
}

function mapGroup(raw: any): WhatsAppGroup {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description || '',
    link: raw.link,
    category: raw.category || '',
    imageId: raw.imageId || null,
    isActive: raw.isActive ?? true,
    sortOrder: raw.sortOrder || 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ===== User News =====

export async function listUserNews(status?: string): Promise<UserNews[]> {
  let query = supabase.from('user_news').select('*').order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapUserNews);
}

export async function getUserNewsById(id: string): Promise<UserNews> {
  const { data, error } = await supabase
    .from('user_news')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapUserNews(data);
}

export async function createUserNews(data: CreateUserNewsData): Promise<UserNews> {
  const { data: record, error } = await supabase
    .from('user_news')
    .insert({
      id: generateId(),
      ...data,
      status: 'pending',
      aiSummary: null,
      aiCategory: null,
      aiAnalysis: null,
      adminNotes: null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapUserNews(record);
}

export async function updateUserNews(id: string, data: UpdateUserNewsData): Promise<UserNews> {
  const { data: record, error } = await supabase
    .from('user_news')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapUserNews(record);
}

export async function deleteUserNews(id: string): Promise<void> {
  const { error } = await supabase.from('user_news').delete().eq('id', id);
  if (error) throw error;
}

function mapUserNews(raw: any): UserNews {
  return {
    id: raw.id,
    title: raw.title,
    categoryId: raw.categoryId || null,
    description: raw.description || '',
    location: raw.location || '',
    whatHappened: raw.whatHappened || '',
    mediaIds: raw.mediaIds || [],
    authorName: raw.authorName,
    authorPhone: raw.authorPhone,
    authorEmail: raw.authorEmail,
    status: raw.status || 'pending',
    aiSummary: raw.aiSummary || null,
    aiCategory: raw.aiCategory || null,
    aiAnalysis: raw.aiAnalysis || null,
    adminNotes: raw.adminNotes || null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ===== AI Config =====

export async function getAIConfig(): Promise<AIConfig | null> {
  const { data, error } = await supabase.from('ai_config').select('*').limit(1);

  if (error || !data || data.length === 0) return null;
  return mapAIConfig(data[0]);
}

export async function saveAIConfig(data: SaveAIConfigData): Promise<AIConfig> {
  const existing = await getAIConfig();

  if (existing) {
    const { data: record, error } = await supabase
      .from('ai_config')
      .update(data)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return mapAIConfig(record);
  }

  const { data: record, error } = await supabase
    .from('ai_config')
    .insert({
      id: generateId(),
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return mapAIConfig(record);
}

function mapAIConfig(raw: any): AIConfig {
  return {
    id: raw.id,
    provider: raw.provider || 'openrouter',
    apiKey: raw.apiKey || '',
    endpoint: raw.endpoint || 'https://openrouter.ai/api/v1',
    model: raw.model || '',
    systemPrompt: raw.systemPrompt || '',
    isActive: raw.isActive ?? true,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ===== System Settings =====

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return data?.value || null;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  const { data: existing } = await supabase
    .from('system_settings')
    .select('id')
    .eq('key', key)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('system_settings')
      .update({ value })
      .eq('key', key);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('system_settings')
      .insert({
        id: generateId(),
        key,
        value,
      });
    if (error) throw error;
  }
}

// ===== User Media Upload =====

export async function uploadUserMedia(file: File): Promise<any> {
  const filename = `${generateId()}_${file.name}`;
  const { data, error } = await supabase.storage.from('user_media').upload(filename, file);

  if (error) throw error;
  return { $id: data.path };
}

export async function deleteUserMedia(fileId: string): Promise<void> {
  const { error } = await supabase.storage.from('user_media').remove([fileId]);
  if (error) throw error;
}

export function getUserMediaView(fileId: string): string {
  const { data } = supabase.storage.from('user_media').getPublicUrl(fileId);
  return data?.publicUrl || '';
}

// ===== Popups =====

export async function listPopups(onlyActive?: boolean): Promise<Popup[]> {
  let query = supabase.from('popups').select('*').order('created_at', { ascending: false });

  if (onlyActive) {
    query = query.eq('isActive', true);
    const { data, error } = await query;
    if (error) throw error;

    const now = new Date();
    return (data || [])
      .filter((p) => new Date(p.startsAt) <= now && new Date(p.endsAt) >= now)
      .map(mapPopup);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapPopup);
}

export async function getPopupById(id: string): Promise<Popup> {
  const { data, error } = await supabase.from('popups').select('*').eq('id', id).single();
  if (error) throw error;
  return mapPopup(data);
}

export async function createPopup(data: CreatePopupData): Promise<Popup> {
  const { data: record, error } = await supabase
    .from('popups')
    .insert({
      id: generateId(),
      ...data,
      impressions: 0,
      clicks: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPopup(record);
}

export async function updatePopup(id: string, data: UpdatePopupData): Promise<Popup> {
  const { data: record, error } = await supabase
    .from('popups')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapPopup(record);
}

export async function deletePopup(id: string): Promise<void> {
  const { error } = await supabase.from('popups').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementPopupImpression(id: string): Promise<void> {
  const popup = await getPopupById(id);
  const { error } = await supabase
    .from('popups')
    .update({ impressions: popup.impressions + 1 })
    .eq('id', id);
  if (error) throw error;
}

export async function incrementPopupClick(id: string): Promise<void> {
  const popup = await getPopupById(id);
  const { error } = await supabase
    .from('popups')
    .update({ clicks: popup.clicks + 1 })
    .eq('id', id);
  if (error) throw error;
}

function mapPopup(raw: any): Popup {
  return {
    id: raw.id,
    title: raw.title,
    type: raw.type || 'image',
    imageId: raw.imageId || null,
    linkUrl: raw.linkUrl || null,
    groupId: raw.groupId || null,
    heading: raw.heading || null,
    description: raw.description || null,
    startsAt: raw.startsAt,
    endsAt: raw.endsAt,
    isActive: raw.isActive ?? true,
    impressions: raw.impressions || 0,
    clicks: raw.clicks || 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ===== Re-export Supabase Client =====

export { supabase };
