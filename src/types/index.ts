export interface ArticleWithCategory {
  id: number
  headline: string
  slug: string
  body: string
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
  isBreaking: boolean
  isFeatured: boolean
  viewCount: number
  categoryId: number
  language: string
  priority: number | null
  category: {
    id: number
    name: string
    slug: string
    color: string | null
  }
}

export interface CategoryWithCount {
  id: number
  name: string
  slug: string
  description: string | null
  color: string | null
  _count: {
    articles: number
  }
}

export interface UploadHistoryRecord {
  id: number
  filename: string
  uploadedAt: Date
  totalRows: number
  successCount: number
  failureCount: number
  status: string
  errorLog: string | null
}

export interface ParsedRow {
  date: Date
  headline: string
  body: string
  categoryName: string
  rowNumber: number
  language: string
  priority: number | null
}

export interface ParseResult {
  valid: ParsedRow[]
  errors: Array<{ row: number; message: string }>
}

export interface UploadResponse {
  success: boolean
  uploadId?: number
  successCount?: number
  failureCount?: number
  errors?: Array<{ row: number; message: string }>
  message?: string
}
