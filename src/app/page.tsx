import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArticleCard } from '@/components/article/ArticleCard'
import { CategorySection } from '@/components/home/CategorySection'
import { Badge } from '@/components/ui/Badge'
import { formatDate, timeAgo, getReadTime } from '@/lib/slug'
import { HOME_LATEST_COUNT, CATEGORY_PREVIEW_COUNT } from '@/lib/utils'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Kahaan Kya Hua | कहाँ क्या हुआ – ताज़ा खबरें',
  description: 'भारत और दुनिया की ताज़ा खबरें। Breaking news and latest updates in Hindi & English.',
}

function getTodayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  return { start, end }
}

async function getHomeData() {
  const { start, end } = getTodayRange()

  const [todayPriority, latest, categories] = await Promise.all([
    // Today's priority articles (priority 1-4, published today)
    prisma.article.findMany({
      where: {
        priority: { not: null },
        publishedAt: { gte: start, lte: end },
      },
      include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      orderBy: [{ priority: 'asc' }, { publishedAt: 'desc' }],
      take: 6,
    }),
    // Latest articles overall
    prisma.article.findMany({
      include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      orderBy: { publishedAt: 'desc' },
      take: HOME_LATEST_COUNT,
    }),
    // Categories with their articles
    prisma.category.findMany({
      include: {
        articles: {
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
          orderBy: { publishedAt: 'desc' },
          take: CATEGORY_PREVIEW_COUNT,
        },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return { todayPriority, latest, categories }
}

function PriorityBadge({ priority }: { priority: number }) {
  const config = {
    1: { label: 'TOP STORY', bg: 'bg-red-600', text: 'text-white' },
    2: { label: 'FEATURED', bg: 'bg-orange-500', text: 'text-white' },
    3: { label: 'HIGHLIGHT', bg: 'bg-yellow-500', text: 'text-white' },
    4: { label: 'TRENDING', bg: 'bg-blue-500', text: 'text-white' },
  }[priority] ?? { label: 'NEWS', bg: 'bg-gray-500', text: 'text-white' }

  return (
    <span className={`${config.bg} ${config.text} text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded`}>
      {config.label}
    </span>
  )
}

export default async function HomePage() {
  const { todayPriority, latest, categories } = await getHomeData()

  const priority1 = todayPriority.find((a) => a.priority === 1)
  const priority2s = todayPriority.filter((a) => a.priority === 2)
  const priority34s = todayPriority.filter((a) => (a.priority ?? 0) >= 3)

  // Hero = priority1 or latest[0]
  const heroArticle = priority1 ?? latest[0] ?? null
  const priorityIds = new Set(todayPriority.map((a) => a.id))
  const gridArticles = latest.filter((a) => a.id !== heroArticle?.id && !priorityIds.has(a.id)).slice(0, 8)
  const sideLatest = latest.filter((a) => a.id !== heroArticle?.id).slice(0, 6)

  const hasPriorityContent = todayPriority.length > 0

  if (latest.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="mb-6">
          <div className="text-7xl mb-4">📰</div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-3">
            कहाँ क्या हुआ
          </h1>
          <p className="text-xl text-gray-400 font-light mb-2">Kahaan Kya Hua</p>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            अभी तक कोई खबर नहीं। Admin panel पर जाकर अपनी पहली Excel file upload करें।
          </p>
        </div>
        <Link
          href="/admin/upload"
          className="inline-flex items-center gap-2 px-8 py-4 bg-brand-red text-white rounded-xl font-semibold text-lg hover:bg-red-700 transition-colors shadow-lg"
        >
          Upload Excel File
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ═══ TODAY'S PRIORITY SECTION ═══ */}
      {hasPriorityContent && (
        <section className="bg-white border-b-4 border-brand-red">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Section label */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-brand-red text-white px-4 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">आज की मुख्य खबरें</span>
              </div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Today&apos;s Priority News
              </div>
            </div>

            {/* Priority 1 — Hero Banner */}
            {priority1 && (
              <div className="mb-6">
                <article className="group relative rounded-2xl overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #1A237E 0%, #0D0D0D 100%)', minHeight: '400px' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="relative p-6 md:p-10 flex flex-col justify-end h-full" style={{ minHeight: '400px' }}>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <PriorityBadge priority={1} />
                      <Badge label={priority1.category.name} color={priority1.category.color} size="sm" />
                      {priority1.isBreaking && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">
                          ब्रेकिंग
                        </span>
                      )}
                    </div>
                    <Link href={`/article/${priority1.slug}`}>
                      <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight group-hover:text-brand-gold transition-colors mb-4 max-w-4xl" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
                        {priority1.headline}
                      </h1>
                    </Link>
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-2 mb-4 max-w-3xl">
                      {priority1.body.slice(0, 240)}…
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <span>{formatDate(priority1.publishedAt)}</span>
                      <span>·</span>
                      <span>{getReadTime(priority1.body)} min read</span>
                      {priority1.language && (
                        <>
                          <span>·</span>
                          <span className={`px-2 py-0.5 rounded text-white text-[10px] font-bold ${priority1.language === 'Hindi' ? 'bg-orange-600' : 'bg-blue-600'}`}>
                            {priority1.language === 'Hindi' ? 'हिंदी' : 'English'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              </div>
            )}

            {/* Priority 2 — Large Cards */}
            {priority2s.length > 0 && (
              <div className={`grid gap-4 mb-6 ${priority2s.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {priority2s.map((article) => (
                  <article
                    key={article.id}
                    className="group relative rounded-xl overflow-hidden text-white article-card-hover"
                    style={{ background: 'linear-gradient(135deg, #B71C1C 0%, #37474F 100%)', minHeight: '240px' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="relative p-5 md:p-6 flex flex-col justify-end h-full" style={{ minHeight: '240px' }}>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <PriorityBadge priority={2} />
                        <Badge label={article.category.name} color={article.category.color} size="sm" />
                      </div>
                      <Link href={`/article/${article.slug}`}>
                        <h2 className="font-serif text-xl md:text-2xl font-bold leading-tight group-hover:text-brand-gold transition-colors mb-2">
                          {article.headline}
                        </h2>
                      </Link>
                      <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                        {article.body.slice(0, 150)}…
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{timeAgo(article.publishedAt)}</span>
                        <span>·</span>
                        <span className={`px-1.5 py-0.5 rounded text-white text-[10px] font-bold ${article.language === 'Hindi' ? 'bg-orange-600/70' : 'bg-blue-600/70'}`}>
                          {article.language === 'Hindi' ? 'हिंदी' : 'EN'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Priority 3 & 4 — Compact highlighted cards */}
            {priority34s.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {priority34s.map((article) => (
                  <article
                    key={article.id}
                    className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white article-card-hover border border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <PriorityBadge priority={article.priority!} />
                      <Badge label={article.category.name} color={article.category.color} size="sm" />
                    </div>
                    <Link href={`/article/${article.slug}`}>
                      <h3 className="font-serif text-sm md:text-base font-bold leading-snug group-hover:text-brand-gold transition-colors line-clamp-3 mb-2">
                        {article.headline}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{timeAgo(article.publishedAt)}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${article.language === 'Hindi' ? 'bg-orange-600/60' : 'bg-blue-600/60'}`}>
                        {article.language === 'Hindi' ? 'हिं' : 'EN'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Hero + Side Latest */}
        {heroArticle && !priority1 && (
          <section className="mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main hero */}
              <div className="lg:col-span-2">
                <article className="group relative rounded-2xl overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #1A237E 0%, #0D0D0D 100%)', minHeight: '360px' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
                  <div className="relative p-6 md:p-8 flex flex-col justify-end" style={{ minHeight: '360px' }}>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {heroArticle.isBreaking && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-red text-white px-2 py-0.5 rounded animate-pulse">
                          Breaking
                        </span>
                      )}
                      <Badge label={heroArticle.category.name} color={heroArticle.category.color} size="sm" />
                    </div>
                    <Link href={`/article/${heroArticle.slug}`}>
                      <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold leading-tight group-hover:text-brand-gold transition-colors mb-3" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                        {heroArticle.headline}
                      </h1>
                    </Link>
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-4 max-w-2xl">
                      {heroArticle.body.slice(0, 200)}…
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatDate(heroArticle.publishedAt)}</span>
                      <span>·</span>
                      <span>{getReadTime(heroArticle.body)} min read</span>
                    </div>
                  </div>
                </article>
              </div>

              {/* Side latest */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                  <span className="w-2 h-2 bg-brand-red rounded-full inline-block animate-pulse" />
                  ताज़ा खबरें
                </h2>
                <div className="space-y-0">
                  {sideLatest.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="horizontal"
                      showExcerpt={false}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* If priority1 showed above, show latest side-by-side differently */}
        {priority1 && (
          <section className="mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 bg-brand-red rounded-full" />
                  <h2 className="text-xl font-serif font-bold text-gray-900">Latest News</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gridArticles.slice(0, 4).map((article) => (
                    <ArticleCard key={article.id} article={article} variant="default" />
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                  <span className="w-2 h-2 bg-brand-red rounded-full inline-block animate-pulse" />
                  ताज़ा अपडेट
                </h2>
                <div className="space-y-0">
                  {sideLatest.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="horizontal"
                      showExcerpt={false}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Latest news grid (when no priority1, show more) */}
        {gridArticles.length > 4 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 bg-brand-red rounded-full" />
              <h2 className="text-xl font-serif font-bold text-gray-900">और खबरें</h2>
              <span className="text-sm text-gray-400">More Stories</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {gridArticles.slice(priority1 ? 4 : 0).map((article) => (
                <ArticleCard key={article.id} article={article} variant="default" />
              ))}
            </div>
          </section>
        )}

        {/* Divider */}
        {categories.length > 0 && (
          <div className="relative mb-12">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-4 text-xs text-gray-400 uppercase tracking-widest font-semibold">
                Category Coverage
              </span>
            </div>
          </div>
        )}

        {/* Category sections */}
        {categories.map((category) =>
          category.articles.length > 0 ? (
            <CategorySection
              key={category.id}
              categoryName={category.name}
              categorySlug={category.slug}
              categoryColor={category.color}
              articles={category.articles}
            />
          ) : null
        )}

        {/* Stats / brand bar */}
        <div className="mt-12 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A237E 0%, #0D0D0D 100%)' }}>
          <div className="p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-serif font-bold mb-1">कहाँ क्या हुआ</h2>
                <p className="text-blue-200 text-sm">भारत की विश्वसनीय खबर — Trusted News of India</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold font-serif text-brand-gold">
                    {await prisma.article.count()}
                  </div>
                  <div className="text-xs text-blue-300 mt-1 uppercase tracking-wide">Articles</div>
                </div>
                <div>
                  <div className="text-3xl font-bold font-serif text-brand-gold">
                    {await prisma.category.count()}
                  </div>
                  <div className="text-xs text-blue-300 mt-1 uppercase tracking-wide">Categories</div>
                </div>
                <div>
                  <div className="text-3xl font-bold font-serif text-brand-gold">
                    {await prisma.article.count({ where: { language: 'Hindi' } })}
                  </div>
                  <div className="text-xs text-blue-300 mt-1 uppercase tracking-wide">हिंदी खबरें</div>
                </div>
                <div>
                  <div className="text-3xl font-bold font-serif text-brand-gold">
                    {await prisma.uploadHistory.count()}
                  </div>
                  <div className="text-xs text-blue-300 mt-1 uppercase tracking-wide">Daily Uploads</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
