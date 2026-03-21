import Link from 'next/link'
import { ArticleCard } from '@/components/article/ArticleCard'

interface Article {
  id: number
  headline: string
  slug: string
  body: string
  publishedAt: Date | string
  isBreaking: boolean
  isFeatured: boolean
  category: { name: string; slug: string; color: string | null }
}

interface CategorySectionProps {
  categoryName: string
  categorySlug: string
  categoryColor: string | null
  articles: Article[]
}

export function CategorySection({
  categoryName,
  categorySlug,
  categoryColor,
  articles,
}: CategorySectionProps) {
  if (articles.length === 0) return null

  return (
    <section className="mb-12">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-6 rounded-full"
            style={{ backgroundColor: categoryColor ?? '#C0392B' }}
          />
          <h2 className="text-xl font-serif font-bold text-gray-900">{categoryName}</h2>
        </div>
        <Link
          href={`/category/${categorySlug}`}
          className="text-sm font-medium text-brand-red hover:underline flex items-center gap-1"
        >
          View all
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} variant="default" />
        ))}
      </div>
    </section>
  )
}
