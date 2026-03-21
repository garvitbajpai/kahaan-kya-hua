'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

interface PreviewRow {
  rowNumber: number
  headline: string
  category: string
  date: string
  bodyPreview: string
  language?: string
  priority?: number | null
}

interface ParseError {
  row: number
  message: string
}

interface PreviewResponse {
  preview: true
  valid: PreviewRow[]
  errors: ParseError[]
  totalRows: number
  validCount: number
  errorCount: number
}

interface ImportResponse {
  success: boolean
  uploadId?: number
  successCount?: number
  failureCount?: number
  errors?: ParseError[]
  message?: string
  error?: string
}

type Phase = 'idle' | 'parsing' | 'preview' | 'importing' | 'done' | 'error'

export default function AdminUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [result, setResult] = useState<ImportResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const reset = () => {
    setFile(null)
    setPhase('idle')
    setPreview(null)
    setResult(null)
    setErrorMsg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFile = useCallback((f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setErrorMsg('Please upload an Excel file (.xlsx or .xls)')
      return
    }
    setFile(f)
    setPhase('idle')
    setPreview(null)
    setResult(null)
    setErrorMsg('')
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleParse = async () => {
    if (!file) return
    setPhase('parsing')
    setErrorMsg('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('confirm', 'false')

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Parse failed')
        setPhase('error')
        return
      }

      setPreview(data)
      setPhase('preview')
    } catch {
      setErrorMsg('Network error. Please try again.')
      setPhase('error')
    }
  }

  const handleConfirm = async () => {
    if (!file) return
    setPhase('importing')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('confirm', 'true')

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data: ImportResponse = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Import failed')
        setPhase('error')
        return
      }

      setResult(data)
      setPhase('done')
    } catch {
      setErrorMsg('Network error during import. Please try again.')
      setPhase('error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Excel File</h1>
          <p className="text-sm text-gray-500 mt-1">
            Import articles from your daily Excel file
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Format guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 Required Excel Format</h3>
        <p className="text-xs text-blue-700 mb-2">Your Excel file must have these exact column headers (case-insensitive):</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { col: 'Date', desc: 'YYYY-MM-DD or MM/DD/YYYY', req: true },
            { col: 'Headline', desc: 'Article title (max 300 chars)', req: true },
            { col: 'News', desc: 'Full article content', req: true },
            { col: 'Category', desc: 'Section name (auto-created)', req: true },
            { col: 'Language', desc: 'Hindi or English (default: Hindi)', req: false },
            { col: 'Priority', desc: '1=Top, 2=Featured, 3=Highlight, 4=Trending', req: false },
          ].map((c) => (
            <div key={c.col} className={`bg-white rounded-lg p-2.5 border ${c.req ? 'border-blue-200' : 'border-green-200'}`}>
              <div className="flex items-center gap-1 mb-0.5">
                <p className="text-xs font-bold text-blue-900 font-mono">{c.col}</p>
                {!c.req && <span className="text-[9px] bg-green-100 text-green-600 px-1 rounded font-bold">NEW</span>}
              </div>
              <p className="text-[10px] text-blue-600">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      {phase === 'idle' && (
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-brand-red bg-red-50'
              : 'border-gray-300 bg-white hover:border-brand-red hover:bg-red-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="text-5xl mb-4">{file ? '📄' : '📤'}</div>
          {file ? (
            <>
              <p className="text-lg font-semibold text-gray-900 mb-1">{file.name}</p>
              <p className="text-sm text-gray-500 mb-4">
                {(file.size / 1024).toFixed(1)} KB · Click to change file
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Drop your Excel file here
              </p>
              <p className="text-sm text-gray-400 mb-4">
                or click to browse — supports .xlsx and .xls
              </p>
            </>
          )}
          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 inline-block">
              {errorMsg}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {phase === 'idle' && file && (
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleParse}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-navy text-white rounded-lg font-medium hover:bg-blue-900 transition-colors"
          >
            📊 Parse & Preview
          </button>
          <button
            onClick={reset}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Parsing loader */}
      {phase === 'parsing' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center mt-4">
          <div className="inline-block w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Parsing your Excel file…</p>
          <p className="text-sm text-gray-400 mt-1">Validating all rows and columns</p>
        </div>
      )}

      {/* Preview phase */}
      {phase === 'preview' && preview && (
        <div className="mt-4 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{preview.totalRows}</div>
              <div className="text-xs text-blue-500 mt-0.5">Total Rows</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{preview.validCount}</div>
              <div className="text-xs text-green-500 mt-0.5">Valid Rows</div>
            </div>
            <div className={`${preview.errorCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 text-center`}>
              <div className={`text-2xl font-bold ${preview.errorCount > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                {preview.errorCount}
              </div>
              <div className={`text-xs mt-0.5 ${preview.errorCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                Errors
              </div>
            </div>
          </div>

          {/* Errors */}
          {preview.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-800 mb-3">
                ⚠️ Validation Errors (rows will be skipped)
              </h3>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {preview.errors.map((err, i) => (
                  <div key={i} className="text-xs text-red-700 flex gap-2">
                    <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded text-red-800 flex-shrink-0">
                      Row {err.row}
                    </span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview table */}
          {preview.valid.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  Preview ({preview.valid.length} articles to import)
                </h3>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {['Row', 'Date', 'Headline', 'Category', 'Language', 'Priority', 'Content Preview'].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.valid.map((row) => (
                      <tr key={row.rowNumber} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-xs text-gray-400 font-mono">
                          #{row.rowNumber}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[200px]">
                          <span className="line-clamp-2">{row.headline}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                            {row.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded font-bold text-white ${
                            row.language === 'English' ? 'bg-blue-500' : 'bg-orange-500'
                          }`}>
                            {row.language === 'English' ? 'EN' : 'हिं'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {row.priority ? (
                            <span className={`text-xs px-2 py-0.5 rounded font-bold text-white ${
                              row.priority === 1 ? 'bg-red-600' :
                              row.priority === 2 ? 'bg-orange-500' :
                              row.priority === 3 ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}>
                              P{row.priority}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-400 max-w-[200px]">
                          <span className="line-clamp-2">{row.bodyPreview}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Confirm / cancel */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleConfirm}
              disabled={preview.validCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-red text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Confirm Import ({preview.validCount} articles)
            </button>
            <button
              onClick={reset}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Importing loader */}
      {phase === 'importing' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center mt-4">
          <div className="inline-block w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Importing articles…</p>
          <p className="text-sm text-gray-400 mt-1">Creating articles and categories in database</p>
        </div>
      )}

      {/* Done */}
      {phase === 'done' && result && (
        <div className="bg-white rounded-2xl border border-green-200 p-8 mt-4 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Import Successful!</h2>
          <p className="text-gray-600 mb-4">{result.message}</p>
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{result.successCount}</div>
              <div className="text-xs text-gray-400">Articles imported</div>
            </div>
            {(result.failureCount ?? 0) > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">{result.failureCount}</div>
                <div className="text-xs text-gray-400">Failed rows</div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="px-5 py-2.5 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              View Website →
            </Link>
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Upload Another File
            </button>
            <Link
              href="/admin/history"
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:border-gray-300 transition-colors"
            >
              View History
            </Link>
          </div>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mt-4 text-center">
          <div className="text-4xl mb-3">❌</div>
          <h2 className="text-lg font-bold text-red-800 mb-2">Upload Failed</h2>
          <p className="text-sm text-red-600 mb-4">{errorMsg}</p>
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
