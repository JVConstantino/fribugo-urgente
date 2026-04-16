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