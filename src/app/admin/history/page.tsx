'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDateShort } from '@/lib/slug'

interface UploadRecord {
  id: number
  filename: string
  uploadedAt: string
  totalRows: number
  successCount: number
  failureCount: number
  status: string
  errorLog: string | null
  _count: { articles: number }
}

interface HistoryResponse {
  history: UploadRecord[]
  total: number
  pages: number
  page: number
}

export default function UploadHistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/upload-history?page=${page}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [page])

  const statusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'partial': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-red-100 text-red-700'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload History</h1>
          <p className="text-sm text-gray-500 mt-1">
            All Excel file uploads and their results
          </p>
        </div>
        <Link
          href="/admin/upload"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          + New Upload
        </Link>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && data && (
        <>
          {data.history.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No uploads yet</h2>
              <Link
                href="/admin/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors mt-4"
              >
                Upload Your First File
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 text-sm text-gray-500">
                {data.total} upload{data.total !== 1 ? 's' : ''} total
              </div>

              <div className="divide-y divide-gray-50">
                {data.history.map((record) => (
                  <div key={record.id} className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      {/* Status dot */}
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                          record.status === 'completed'
                            ? 'bg-green-500'
                            : record.status === 'partial'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                          <span className="font-medium text-gray-800 truncate">{record.filename}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle(record.status)}`}>
                            {record.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                          <span>📅 {formatDateShort(record.uploadedAt)}</span>
                          <span>📊 {record.totalRows} total rows</span>
                          <span className="text-green-600">✅ {record.successCount} imported</span>
                          {record.failureCount > 0 && (
                            <span className="text-red-500">❌ {record.failureCount} failed</span>
                          )}
                        </div>

                        {/* Error log toggle */}
                        {record.failureCount > 0 && record.errorLog && (
                          <button
                            onClick={() =>
                              setExpandedId(expandedId === record.id ? null : record.id)
                            }
                            className="mt-2 text-xs text-brand-red hover:underline"
                          >
                            {expandedId === record.id ? '▲ Hide errors' : '▼ Show errors'}
                          </button>
                        )}

                        {expandedId === record.id && record.errorLog && (
                          <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-3 space-y-1">
                            {JSON.parse(record.errorLog).map(
                              (err: { row: number; message: string }, i: number) => (
                                <div key={i} className="text-xs text-red-700 flex gap-2">
                                  <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                    Row {err.row}
                                  </span>
                                  <span>{err.message}</span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-gray-700">{record.successCount}</div>
                        <div className="text-xs text-gray-400">articles</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <button
                      onClick={() => setPage(page - 1)}
                      className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors"
                    >
                      ← Prev
                    </button>
                  )}
                  {Array.from({ length: data.pages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - page) <= 2)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          p === page
                            ? 'bg-brand-red text-white'
                            : 'bg-white border border-gray-200 hover:border-brand-red hover:text-brand-red'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  {page < data.pages && (
                    <button
                      onClick={() => setPage(page + 1)}
                      className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors"
                    >
                      Next →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
