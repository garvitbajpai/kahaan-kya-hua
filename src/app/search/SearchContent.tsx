'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArticleCard } from '@/components/article/ArticleCard'
import Link from 'next/link'

interface Article {
  id: number
  headline: string
  slug: string
  body: string
  publishedAt: string
  isBreaking: boolean
  isFeatured: boolean
  category: { name: string; slug: string; color: string | null }
}

interface SearchResult {
  articles: Article[]
  total: number
  query: string
  pages: number
  page: number
}

export default function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQ = searchParams.get('q') ?? ''
  const initialPage = parseInt(searchParams.get('page') ?? '1')

  const [query, setQuery] = useState(initialQ)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  const doSearch = useCallback(async (q: string, page: number) => {
    if (!q.trim() || q.trim().length < 2) {
      setResult(null)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${page}`)
      const data = await res.json()
      setResult(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialQ) doSearch(initialQ, initialPage)
  }, [initialQ, initialPage, doSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-6">Search News</h1>

        <form onSubmit={handleSubmit} className="flex gap-3 max-w-2xl">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headlines, categories, topics..."
            className="flex-1 px-5 py-3 text-base border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            className="px-6 py-3 bg-brand-red text-white rounded-full font-medium hover:bg-red-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-gray-500">Searching…</p>
        </div>
      )}

      {!loading && result && (
        <>
          <div className="mb-6 text-sm text-gray-500">
            {result.total === 0 ? (
              <span>No results for <strong>&ldquo;{result.query}&rdquo;</strong></span>
            ) : (
              <span>
                Found <strong>{result.total}</strong> result{result.total !== 1 ? 's' : ''} for{' '}
                <strong>&ldquo;{result.query}&rdquo;</strong>
              </span>
            )}
          </div>

          {result.articles.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No articles found</h2>
              <p className="text-gray-500 mb-6">Try different keywords or browse by category</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {result.articles.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="default" />
                ))}
              </div>

              {result.pages > 1 && (
                <nav className="flex items-center justify-center gap-2">
                  {result.page > 1 && (
                    <Link
                      href={`/search?q=${encodeURIComponent(result.query)}&page=${result.page - 1}`}
                      className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors"
                    >
                      ← Prev
                    </Link>
                  )}
                  {Array.from({ length: result.pages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - result.page) <= 2)
                    .map((p) => (
                      <Link
                        key={p}
                        href={`/search?q=${encodeURIComponent(result.query)}&page=${p}`}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                          p === result.page
                            ? 'bg-brand-red text-white'
                            : 'bg-white border border-gray-200 hover:border-brand-red hover:text-brand-red'
                        }`}
                      >
                        {p}
                      </Link>
                    ))}
                  {result.page < result.pages && (
                    <Link
                      href={`/search?q=${encodeURIComponent(result.query)}&page=${result.page + 1}`}
                      className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors"
                    >
                      Next →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </>
      )}

      {!loading && !result && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-4">📰</div>
          <p className="text-lg">Enter a keyword to search articles</p>
        </div>
      )}
    </div>
  )
}
