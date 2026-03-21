import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Badge } from '@/components/ui/Badge'
import { ShareButton } from '@/components/article/ShareButton'
import { formatDate, getReadTime } from '@/lib/slug'
import { RELATED_COUNT } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

async function getArticle(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true, color: true } },
    },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle(params.slug)
  if (!article) return { title: 'Article Not Found' }

  const description = article.body.slice(0, 160)

  return {
    title: `${article.headline} | Kahaan Kya Hua`,
    description,
    openGraph: {
      title: article.headline,
      description,
      type: 'article',
      publishedTime: article.publishedAt.toISOString(),
      section: article.category.name,
    },
    alternates: {
      canonical: `/article/${article.slug}`,
    },
  }
}


function PriorityLabel({ priority }: { priority: number }) {
  const config: Record<number, { label: string; bg: string }> = {
    1: { label: 'Top Story', bg: 'bg-red-600' },
    2: { label: 'Featured', bg: 'bg-orange-500' },
    3: { label: 'Highlight', bg: 'bg-yellow-500' },
    4: { label: 'Trending', bg: 'bg-blue-500' },
  }
  const c = config[priority]
  if (!c) return null
  return (
    <span className={`${c.bg} text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded`}>
      {c.label}
    </span>
  )
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle(params.slug)
  if (!article) notFound()

  // Increment views
  await prisma.article.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } },
  })

  // Related articles
  const related = await prisma.article.findMany({
    where: {
      categoryId: article.categoryId,
      id: { not: article.id },
    },
    include: { category: { select: { id: true, name: true, slug: true, color: true } } },
    orderBy: { publishedAt: 'desc' },
    take: RELATED_COUNT,
  })

  const readTime = getReadTime(article.body)
  const paragraphs = article.body
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  const isHindi = article.language === 'Hindi'

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Article hero banner */}
      <div
        className="relative text-white py-10 md:py-14"
        style={{
          background: `linear-gradient(135deg, ${article.category.color ?? '#1A237E'} 0%, #0D0D0D 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-4xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/category/${article.category.slug}`} className="hover:text-white transition-colors">
              {article.category.name}
            </Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white/80 line-clamp-1 text-xs">{article.headline.slice(0, 50)}…</span>
          </nav>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {article.isBreaking && (
              <span className="text-xs font-bold uppercase tracking-wider bg-red-600 text-white px-2.5 py-1 rounded animate-pulse">
                🔴 Breaking News
              </span>
            )}
            {article.priority && <PriorityLabel priority={article.priority} />}
            <Link href={`/category/${article.category.slug}`}>
              <Badge label={article.category.name} color={article.category.color} size="md" />
            </Link>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded text-white ${
                isHindi ? 'bg-orange-600' : 'bg-blue-600'
              }`}
            >
              {isHindi ? '🇮🇳 हिंदी' : '🇬🇧 English'}
            </span>
          </div>

          {/* Headline */}
          <h1
            className={`text-2xl sm:text-3xl md:text-4xl font-serif font-bold leading-tight text-white mb-4 ${
              isHindi ? 'lang-hindi' : ''
            }`}
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}
          >
            {article.headline}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{readTime} min read</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{article.viewCount.toLocaleString()} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main article body */}
          <article className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
              {/* Article body */}
              <div className={`space-y-4 ${isHindi ? 'lang-hindi' : ''}`}>
                {paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className={`leading-relaxed text-gray-700 ${
                      isHindi ? 'text-base md:text-lg' : 'text-base md:text-lg'
                    } ${i === 0 ? 'text-lg md:text-xl font-medium text-gray-800' : ''}`}
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Article footer */}
              <div className="mt-10 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Link
                    href={`/category/${article.category.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    More {article.category.name} news
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Share:</span>
                    <ShareButton />
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Category card */}
            <div
              className="rounded-xl p-5 text-white"
              style={{
                background: `linear-gradient(135deg, ${article.category.color ?? '#D32F2F'}, ${article.category.color ?? '#D32F2F'}bb)`,
              }}
            >
              <p className="text-xs uppercase tracking-wider opacity-75 mb-1">Category</p>
              <h3 className="text-xl font-serif font-bold mb-3">{article.category.name}</h3>
              <Link
                href={`/category/${article.category.slug}`}
                className="inline-flex items-center gap-1 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 transition-colors"
              >
                Browse all articles →
              </Link>
            </div>

            {/* Language info card */}
            <div className={`rounded-xl p-5 border-2 ${isHindi ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}`}>
              <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${isHindi ? 'text-orange-600' : 'text-blue-600'}`}>
                Language / भाषा
              </p>
              <p className={`text-lg font-bold ${isHindi ? 'text-orange-800' : 'text-blue-800'}`}>
                {isHindi ? '🇮🇳 हिंदी' : '🇬🇧 English'}
              </p>
              <p className={`text-xs mt-1 ${isHindi ? 'text-orange-600' : 'text-blue-600'}`}>
                {isHindi ? 'यह लेख हिंदी में है' : 'This article is in English'}
              </p>
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: article.category.color ?? '#D32F2F' }}
                  />
                  Related Articles
                </h2>
                <div className="space-y-4">
                  {related.map((rel) => (
                    <ArticleCard
                      key={rel.id}
                      article={rel}
                      variant="compact"
                      showExcerpt={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
