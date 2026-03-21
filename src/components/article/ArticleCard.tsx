import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { timeAgo, getReadTime } from '@/lib/slug'
import { cn } from '@/lib/utils'

interface Article {
  id: number
  headline: string
  slug: string
  body: string
  publishedAt: Date | string
  isBreaking?: boolean
  isFeatured?: boolean
  language?: string
  priority?: number | null
  category: {
    name: string
    slug: string
    color: string | null
  }
}

interface ArticleCardProps {
  article: Article
  variant?: 'default' | 'horizontal' | 'compact' | 'featured'
  className?: string
  showExcerpt?: boolean
}

function LangBadge({ language }: { language?: string }) {
  if (!language) return null
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${
      language === 'Hindi' ? 'bg-orange-500' : 'bg-blue-500'
    }`}>
      {language === 'Hindi' ? 'हिं' : 'EN'}
    </span>
  )
}

export function ArticleCard({
  article,
  variant = 'default',
  className,
  showExcerpt = true,
}: ArticleCardProps) {
  const excerpt = article.body.slice(0, 140) + (article.body.length > 140 ? '…' : '')
  const readTime = getReadTime(article.body)
  const isHindi = article.language === 'Hindi'

  if (variant === 'featured') {
    return (
      <article className={cn('group relative rounded-xl overflow-hidden text-white', className)}
        style={{ background: 'linear-gradient(135deg, #1A237E 0%, #0D0D0D 100%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="relative p-6 md:p-8 h-full flex flex-col justify-end min-h-[340px]">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {article.isBreaking && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-red text-white px-2 py-0.5 rounded animate-pulse">
                Breaking
              </span>
            )}
            <Badge label={article.category.name} color={article.category.color} size="sm" />
            <LangBadge language={article.language} />
          </div>
          <Link href={`/article/${article.slug}`}>
            <h2 className={`font-serif text-xl md:text-2xl lg:text-3xl font-bold leading-tight group-hover:text-brand-gold transition-colors mb-3 ${isHindi ? 'lang-hindi' : ''}`}>
              {article.headline}
            </h2>
          </Link>
          {showExcerpt && (
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2 mb-4">{excerpt}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{timeAgo(article.publishedAt)}</span>
            <span>·</span>
            <span>{readTime} min read</span>
          </div>
        </div>
      </article>
    )
  }

  if (variant === 'horizontal') {
    return (
      <article className={cn('group flex gap-3 py-3 border-b border-gray-100 last:border-0', className)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge label={article.category.name} color={article.category.color} size="sm" />
            <LangBadge language={article.language} />
          </div>
          <Link href={`/article/${article.slug}`}>
            <h3 className={`font-serif font-semibold text-gray-900 leading-snug mt-1 group-hover:text-brand-red transition-colors line-clamp-2 text-sm ${isHindi ? 'lang-hindi' : ''}`}>
              {article.headline}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <span>{timeAgo(article.publishedAt)}</span>
            <span>·</span>
            <span>{readTime} min read</span>
          </div>
        </div>
        {article.isBreaking && (
          <div className="w-1 rounded-full bg-brand-red flex-shrink-0" />
        )}
      </article>
    )
  }

  if (variant === 'compact') {
    return (
      <article className={cn('group', className)}>
        <Link href={`/article/${article.slug}`}>
          <h4 className={`text-sm font-medium text-gray-800 leading-snug group-hover:text-brand-red transition-colors line-clamp-2 ${isHindi ? 'lang-hindi' : ''}`}>
            {article.headline}
          </h4>
        </Link>
        <div className="flex items-center gap-1.5 mt-1">
          <p className="text-xs text-gray-400">{timeAgo(article.publishedAt)}</p>
          <LangBadge language={article.language} />
        </div>
      </article>
    )
  }

  // Default card
  return (
    <article
      className={cn(
        'group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5',
        className
      )}
    >
      {/* Color accent bar */}
      <div
        className="h-1"
        style={{ backgroundColor: article.category.color ?? '#D32F2F' }}
      />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Badge label={article.category.name} color={article.category.color} size="sm" />
            <LangBadge language={article.language} />
          </div>
          {article.isBreaking && (
            <span className="text-[9px] font-black text-brand-red uppercase animate-pulse">🔴 Breaking</span>
          )}
        </div>
        <Link href={`/article/${article.slug}`}>
          <h3 className={`font-serif font-bold text-gray-900 leading-snug group-hover:text-brand-red transition-colors line-clamp-3 mb-2 ${isHindi ? 'lang-hindi' : ''}`}>
            {article.headline}
          </h3>
        </Link>
        {showExcerpt && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{excerpt}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{timeAgo(article.publishedAt)}</span>
          <span>{readTime} min read</span>
        </div>
      </div>
    </article>
  )
}
