import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Badge } from '@/components/ui/Badge'
import { ARTICLES_PER_PAGE } from '@/lib/utils'
import { formatDate, getReadTime } from '@/lib/slug'

export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
  searchParams: { page?: string }
}

async function getCategory(slug: string) {
  try {
    return await prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { articles: true } } },
    })
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory(params.slug)
  if (!category) return { title: 'Category Not Found' }

  return {
    title: `${category.name} | Kahaan Kya Hua`,
    description: `Latest ${category.name} news and updates on Kahaan Kya Hua. Browse ${category._count.articles} articles.`,
    openGraph: {
      title: `${category.name} – Kahaan Kya Hua`,
      type: 'website',
    },
  }
}


export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategory(params.slug)
  if (!category) notFound()

  const page = parseInt(searchParams.page ?? '1')
  const limit = ARTICLES_PER_PAGE

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { category: { slug: params.slug } },
      include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }).catch(() => []),
    prisma.article.count({ where: { category: { slug: params.slug } } }).catch(() => 0),
  ])

  const pages = Math.ceil(total / limit)
  const featuredArticle = articles[0] ?? null
  const restArticles = articles.slice(1)

  const catColor = category.color ?? '#D32F2F'

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Category Hero Banner */}
      <div
        className="relative text-white"
        style={{ background: `linear-gradient(135deg, ${catColor} 0%, ${catColor}88 50%, #0D0D0D 100%)` }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-medium">{category.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                Category
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-white/80 text-base max-w-2xl leading-relaxed">{category.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center bg-white/20 rounded-xl px-5 py-3">
                <div className="text-2xl font-bold font-serif">{total}</div>
                <div className="text-xs text-white/70 uppercase tracking-wide">Articles</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg font-medium">No articles yet in this category</p>
            <Link href="/" className="mt-4 inline-block text-brand-red hover:underline text-sm">
              ← Back to Home
            </Link>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featuredArticle && page === 1 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: catColor }} />
                  <h2 className="text-lg font-serif font-bold text-gray-900">Featured Story</h2>
                </div>
                <article className="group relative rounded-2xl overflow-hidden text-white article-card-hover"
                  style={{ background: `linear-gradient(135deg, ${catColor} 0%, #0D0D0D 100%)`, minHeight: '320px' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="relative p-6 md:p-8 flex flex-col justify-end" style={{ minHeight: '320px' }}>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {featuredArticle.isBreaking && (
                        <span className="text-[10px] font-bold uppercase bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">
                          Breaking
                        </span>
                      )}
                      <Badge label={category.name} color={category.color} size="sm" />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${featuredArticle.language === 'Hindi' ? 'bg-orange-600/70' : 'bg-blue-600/70'}`}>
                        {featuredArticle.language === 'Hindi' ? 'हिंदी' : 'English'}
                      </span>
                    </div>
                    <Link href={`/article/${featuredArticle.slug}`}>
                      <h2 className="font-serif text-2xl md:text-3xl font-bold leading-tight group-hover:text-brand-gold transition-colors mb-3" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                        {featuredArticle.headline}
                      </h2>
                    </Link>
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-4 max-w-3xl">
                      {featuredArticle.body.slice(0, 200)}…
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatDate(featuredArticle.publishedAt)}</span>
                      <span>·</span>
                      <span>{getReadTime(featuredArticle.body)} min read</span>
                    </div>
                  </div>
                </article>
              </div>
            )}

            {/* Rest of articles */}
            {restArticles.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: catColor }} />
                  <h2 className="text-lg font-serif font-bold text-gray-900">
                    {page === 1 ? 'Latest Articles' : `Page ${page}`}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {restArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} variant="default" />
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-8">
                {page > 1 && (
                  <Link
                    href={`/category/${params.slug}?page=${page - 1}`}
                    className="px-4 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors font-medium"
                  >
                    ← Prev
                  </Link>
                )}
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= 2)
                  .map((p) => (
                    <Link
                      key={p}
                      href={`/category/${params.slug}?page=${p}`}
                      className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                        p === page
                          ? 'text-white shadow-md'
                          : 'bg-white border-2 border-gray-200 hover:border-brand-red hover:text-brand-red'
                      }`}
                      style={p === page ? { backgroundColor: catColor } : {}}
                    >
                      {p}
                    </Link>
                  ))}
                {page < pages && (
                  <Link
                    href={`/category/${params.slug}?page=${page + 1}`}
                    className="px-4 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors font-medium"
                  >
                    Next →
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )
}
