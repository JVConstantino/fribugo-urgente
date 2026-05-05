// ===== Article =====

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImageId: string | null;
  categoryId: string;
  authorId: string;
  isBreaking: boolean;
  isPublished: boolean;
  publishedAt: string;
  views: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImageId: string | null;
  categoryId: string;
  authorId: string;
  isBreaking: boolean;
  isPublished: boolean;
  publishedAt: string;
  tags: string[];
}

export interface UpdateArticleData {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  coverImageId?: string | null;
  categoryId?: string;
  authorId?: string;
  isBreaking?: boolean;
  isPublished?: boolean;
  publishedAt?: string;
  tags?: string[];
}

// ===== Category =====

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  sortOrder: number;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  color: string;
  icon: string;
  sortOrder: number;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

// ===== Newsletter =====

export interface Newsletter {
  id: string;
  email: string;
  subscribedAt: string;
  isActive: boolean;
}

// ===== User (Auth) =====

export interface User {
  id: string;
  name: string;
  email: string;
}

// ===== Filters =====

export interface ArticleFilters {
  categoryId?: string;
  isPublished?: boolean;
  isBreaking?: boolean;
  search?: string;
}

// ===== Ads =====

export type AdFormat = "leaderboard" | "banner" | "sidebar" | "square";
export type AdPage = "home" | "article" | "category" | "all";

export interface Ad {
  id: string;
  title: string;
  imageId: string | null;
  linkUrl: string;
  format: AdFormat;
  pages: AdPage[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  dailyLimit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdData {
  title: string;
  imageId: string | null;
  linkUrl: string;
  format: AdFormat;
  pages: AdPage[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  dailyLimit: number | null;
}

export interface UpdateAdData {
  title?: string;
  imageId?: string | null;
  linkUrl?: string;
  format?: AdFormat;
  pages?: AdPage[];
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
  dailyLimit?: number | null;
}

// ===== WhatsApp Groups =====

export interface WhatsAppGroup {
  id: string;
  title: string;
  description: string;
  link: string;
  category: string;
  imageId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWhatsAppGroupData {
  title: string;
  description: string;
  link: string;
  category: string;
  imageId: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface UpdateWhatsAppGroupData {
  title?: string;
  description?: string;
  link?: string;
  category?: string;
  imageId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

// ===== User News (notícias enviadas por internautas) =====

export type UserNewsStatus = "pending" | "processing" | "processed" | "rejected";

export interface UserNews {
  id: string;
  title: string;
  categoryId: string | null;
  description: string;
  location: string;
  whatHappened: string;
  mediaIds: string[];
  authorName: string;
  authorPhone: string;
  authorEmail: string;
  status: UserNewsStatus;
  aiSummary: string | null;
  aiCategory: string | null;
  aiAnalysis: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserNewsData {
  title: string;
  categoryId: string | null;
  description: string;
  location: string;
  whatHappened: string;
  mediaIds: string[];
  authorName: string;
  authorPhone: string;
  authorEmail: string;
}

export interface UpdateUserNewsData {
  title?: string;
  categoryId?: string | null;
  description?: string;
  location?: string;
  whatHappened?: string;
  mediaIds?: string[];
  authorName?: string;
  authorPhone?: string;
  authorEmail?: string;
  status?: UserNewsStatus;
  aiSummary?: string | null;
  aiCategory?: string | null;
  aiAnalysis?: string | null;
  adminNotes?: string | null;
}

// ===== AI Config =====

export interface AIConfig {
  id: string;
  provider: string;
  apiKey: string;
  endpoint: string;
  model: string;
  systemPrompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveAIConfigData {
  provider: string;
  apiKey: string;
  endpoint: string;
  model: string;
  systemPrompt: string;
  isActive: boolean;
}

// ===== Popups =====

export type PopupType = "image" | "group";

export interface Popup {
  id: string;
  title: string;
  type: PopupType;
  imageId: string | null;
  linkUrl: string | null;
  groupId: string | null;
  heading: string | null;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePopupData {
  title: string;
  type: PopupType;
  imageId: string | null;
  linkUrl: string | null;
  groupId: string | null;
  heading: string | null;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export type UpdatePopupData = Partial<CreatePopupData>;

// ===== Appwrite Document Helper =====

export interface AppwriteDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
  $databaseId: string;
  [key: string]: unknown;
}