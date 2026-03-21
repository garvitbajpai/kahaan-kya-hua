'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Article {
  id: number
  headline: string
  slug: string
  publishedAt: string
  viewCount: number
  isBreaking: boolean
  isFeatured: boolean
  category: { name: string; color: string | null }
}

interface ArticlesResponse {
  articles: Article[]
  pagination: { page: number; pages: number; total: number }
}

// Group articles by their published date string
function groupByDate(articles: Article[]): Record<string, Article[]> {
  return articles.reduce<Record<string, Article[]>>((acc, article) => {
    const dateKey = new Date(article.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(article)
    return acc
  }, {})
}

export default function AdminArticlesPage() {
  const [data, setData] = useState<ArticlesResponse | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'single' | 'day' | 'selected'
    id?: number
    date?: string
    label: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (categoryFilter) params.set('category', categoryFilter)
      const res = await fetch(`/api/articles?${params}`)
      const d = await res.json()
      setData(d)
    } finally {
      setLoading(false)
    }
  }, [page, categoryFilter])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  // Delete single article
  const deleteSingle = async (id: number) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('Article deleted successfully', true)
        setData((prev) =>
          prev
            ? { ...prev, articles: prev.articles.filter((a) => a.id !== id) }
            : prev
        )
      } else {
        showToast('Failed to delete article', false)
      }
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  // Delete by day
  const deleteByDay = async (date: string) => {
    setDeleting(true)
    try {
      const res = await fetch('/api/articles/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      const d = await res.json()
      if (res.ok) {
        showToast(`Deleted ${d.deleted} articles from this day`, true)
        fetchArticles()
      } else {
        showToast('Failed to delete articles', false)
      }
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  // Delete selected
  const deleteSelected = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/articles/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      const d = await res.json()
      if (res.ok) {
        showToast(`Deleted ${d.deleted} articles`, true)
        setSelectedIds(new Set())
        fetchArticles()
      } else {
        showToast('Failed to delete articles', false)
      }
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  const handleConfirm = () => {
    if (!confirmDelete) return
    if (confirmDelete.type === 'single' && confirmDelete.id) deleteSingle(confirmDelete.id)
    else if (confirmDelete.type === 'day' && confirmDelete.date) deleteByDay(confirmDelete.date)
    else if (confirmDelete.type === 'selected') deleteSelected()
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectDay = (articles: Article[]) => {
    const allSelected = articles.every((a) => selectedIds.has(a.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      articles.forEach((a) => (allSelected ? next.delete(a.id) : next.add(a.id)))
      return next
    })
  }

  const filteredArticles = data?.articles.filter((a) =>
    searchQ ? a.headline.toLowerCase().includes(searchQ.toLowerCase()) : true
  ) ?? []

  const grouped = groupByDate(filteredArticles)
  const dateKeys = Object.keys(grouped)

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg transition-all ${
            toast.ok ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-3xl mb-3 text-center">🗑️</div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Confirm Delete</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              {confirmDelete.label}
              <br />
              <span className="text-red-500 font-medium">This cannot be undone.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Articles</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.pagination.total ?? 0} total articles — delete individually or by day
          </p>
        </div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
          ← Dashboard
        </Link>
      </div>

      {/* Filters + bulk actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search headlines…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-red"
        />

        {selectedIds.size > 0 && (
          <button
            onClick={() =>
              setConfirmDelete({
                type: 'selected',
                label: `Delete ${selectedIds.size} selected article${selectedIds.size !== 1 ? 's' : ''}?`,
              })
            }
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            🗑️ Delete Selected ({selectedIds.size})
          </button>
        )}

        {selectedIds.size > 0 && (
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Articles grouped by date */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : dateKeys.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-lg font-medium">No articles found</p>
        </div>
      ) : (
        <div className="space-y-5">
          {dateKeys.map((dateKey) => {
            const articles = grouped[dateKey]
            const allDaySelected = articles.every((a) => selectedIds.has(a.id))
            // Get raw date for day-delete (use first article's publishedAt)
            const rawDate = new Date(articles[0].publishedAt).toISOString().split('T')[0]

            return (
              <div key={dateKey} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Day header */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={allDaySelected}
                      onChange={() => toggleSelectDay(articles)}
                      className="w-4 h-4 accent-brand-red cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-gray-800 text-sm">{dateKey}</span>
                      <span className="ml-2 text-xs text-gray-400">
                        {articles.length} article{articles.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setConfirmDelete({
                        type: 'day',
                        date: rawDate,
                        label: `Delete ALL ${articles.length} articles published on ${dateKey}?`,
                      })
                    }
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium border border-red-200"
                  >
                    🗑️ Delete All This Day
                  </button>
                </div>

                {/* Articles list */}
                <div className="divide-y divide-gray-50">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className={`flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors ${
                        selectedIds.has(article.id) ? 'bg-red-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(article.id)}
                        onChange={() => toggleSelect(article.id)}
                        className="w-4 h-4 accent-brand-red cursor-pointer flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span
                            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${article.category.color ?? '#C0392B'}20`,
                              color: article.category.color ?? '#C0392B',
                            }}
                          >
                            {article.category.name}
                          </span>
                          {article.isBreaking && (
                            <span className="text-[10px] font-bold uppercase bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                              Breaking
                            </span>
                          )}
                          {article.isFeatured && (
                            <span className="text-[10px] font-bold uppercase bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-lg">
                          {article.headline}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{article.viewCount} views</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/article/${article.slug}`}
                          target="_blank"
                          className="text-xs text-gray-400 hover:text-brand-red transition-colors px-2 py-1 rounded hover:bg-gray-100"
                        >
                          View
                        </Link>
                        <button
                          onClick={() =>
                            setConfirmDelete({
                              type: 'single',
                              id: article.id,
                              label: `Delete "${article.headline.slice(0, 60)}${article.headline.length > 60 ? '…' : ''}"?`,
                            })
                          }
                          className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors px-2 py-1 rounded border border-red-100 hover:border-red-200"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <nav className="flex items-center justify-center gap-2 mt-6">
          {data.pagination.page > 1 && (
            <button
              onClick={() => setPage(data.pagination.page - 1)}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors"
            >
              ← Prev
            </button>
          )}
          {Array.from({ length: data.pagination.pages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - data.pagination.page) <= 2)
            .map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  p === data.pagination.page
                    ? 'bg-brand-red text-white'
                    : 'bg-white border border-gray-200 hover:border-brand-red hover:text-brand-red'
                }`}
              >
                {p}
              </button>
            ))}
          {data.pagination.page < data.pagination.pages && (
            <button
              onClick={() => setPage(data.pagination.page + 1)}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors"
            >
              Next →
            </button>
          )}
        </nav>
      )}
    </div>
  )
}
