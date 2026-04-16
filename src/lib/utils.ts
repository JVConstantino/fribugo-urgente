import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Merge class names with tailwind-merge to handle conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Convert text to a URL-friendly slug.
 * Handles Portuguese characters and common accented letters.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format a date to Brazilian format: "dd/MM/yyyy"
 */
export function formatDate(date: string | Date): string {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return format(parsed, "dd/MM/yyyy", { locale: ptBR });
}

/**
 * Format a date as a relative time string in Portuguese.
 * Examples: "há 2 horas", "há 3 dias", "há 1 minuto"
 */
export function formatRelativeDate(date: string | Date): string {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(parsed, {
    addSuffix: true,
    locale: ptBR,
  });
}

/**
 * Truncate text to a maximum length, adding an ellipsis if needed.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

/**
 * Estimate reading time in minutes based on content length.
 * Average reading speed: ~200 words per minute (Portuguese).
 */
export function getReadingTime(content: string): number {
  const wordsPerMinute = 200;
  // Strip HTML tags if present
  const plainText = content.replace(/<[^>]*>/g, "");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, minutes);
}