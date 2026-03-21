import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDateShort } from '@/lib/slug'

export const dynamic = 'force-dynamic'

async function getDashboardStats() {
  const [
    totalArticles,
    totalCategories,
    totalUploads,
    recentUploads,
    recentArticles,
    topCategories,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.category.count(),
    prisma.uploadHistory.count(),
    prisma.uploadHistory.findMany({
      orderBy: { uploadedAt: 'desc' },
      take: 5,
    }),
    prisma.article.findMany({
      include: { category: { select: { name: true, color: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.category.findMany({
      include: { _count: { select: { articles: true } } },
      orderBy: { articles: { _count: 'desc' } },
      take: 5,
    }),
  ])

  return {
    totalArticles,
    totalCategories,
    totalUploads,
    recentUploads,
    recentArticles,
    topCategories,
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  const cards = [
    { label: 'Total Articles', value: stats.totalArticles, icon: '📰', color: 'bg-blue-500', href: '/' },
    { label: 'Categories', value: stats.totalCategories, icon: '🏷️', color: 'bg-green-500', href: '/admin/history' },
    { label: 'Excel Uploads', value: stats.totalUploads, icon: '📤', color: 'bg-purple-500', href: '/admin/history' },
    { label: 'Today\'s Articles', value: stats.recentArticles.filter(a => {
      const today = new Date()
      const art = new Date(a.createdAt)
      return art.toDateString() === today.toDateString()
    }).length, icon: '📅', color: 'bg-orange-500', href: '/admin/upload' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDateShort(new Date())} — Welcome back!
          </p>
        </div>
        <Link
          href="/admin/upload"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <span>+</span> Upload Excel
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center text-lg`}>
                {card.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent uploads */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Uploads</h2>
            <Link href="/admin/history" className="text-xs text-brand-red hover:underline">
              View all
            </Link>
          </div>
          {stats.recentUploads.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">No uploads yet</p>
              <Link href="/admin/upload" className="text-xs text-brand-red hover:underline mt-1 block">
                Upload your first file →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentUploads.map((upload) => (
                <div key={upload.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      upload.status === 'completed'
                        ? 'bg-green-500'
                        : upload.status === 'partial'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{upload.filename}</p>
                    <p className="text-xs text-gray-400">
                      {upload.successCount} imported · {formatDateShort(upload.uploadedAt)}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      upload.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : upload.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {upload.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top categories */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top Categories</h2>
          </div>
          {stats.topCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🏷️</div>
              <p className="text-sm">No categories yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topCategories.map((cat) => {
                const percentage = stats.totalArticles
                  ? Math.round((cat._count.articles / stats.totalArticles) * 100)
                  : 0
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                      <span className="text-xs text-gray-400">{cat._count.articles} articles</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: cat.color ?? '#C0392B',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent articles */}
      {stats.recentArticles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recently Added Articles</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs text-gray-400 uppercase tracking-wider font-medium">Headline</th>
                  <th className="text-left py-2 text-xs text-gray-400 uppercase tracking-wider font-medium">Category</th>
                  <th className="text-left py-2 text-xs text-gray-400 uppercase tracking-wider font-medium">Date</th>
                  <th className="text-left py-2 text-xs text-gray-400 uppercase tracking-wider font-medium">Views</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {stats.recentArticles.map((article) => (
                  <tr key={article.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 pr-4">
                      <span className="font-medium text-gray-800 line-clamp-1 max-w-xs block">
                        {article.headline}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: `${article.category.color ?? '#C0392B'}20`,
                          color: article.category.color ?? '#C0392B',
                        }}
                      >
                        {article.category.name}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-400 text-xs whitespace-nowrap">
                      {formatDateShort(article.createdAt)}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-400 text-xs">
                      {article.viewCount}
                    </td>
                    <td className="py-2.5">
                      <Link
                        href={`/article/${article.slug}`}
                        target="_blank"
                        className="text-xs text-brand-red hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
