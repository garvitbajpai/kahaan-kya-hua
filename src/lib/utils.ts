import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CATEGORY_COLORS = [
  '#C0392B', '#2980B9', '#27AE60', '#8E44AD',
  '#E67E22', '#16A085', '#D35400', '#2C3E50',
  '#1ABC9C', '#E74C3C', '#3498DB', '#F39C12',
]

export function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

export const ARTICLES_PER_PAGE = 12
export const HOME_LATEST_COUNT = 9
export const CATEGORY_PREVIEW_COUNT = 4
export const RELATED_COUNT = 3
