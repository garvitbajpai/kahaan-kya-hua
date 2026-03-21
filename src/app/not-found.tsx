import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <div className="text-8xl font-serif font-bold text-gray-100 mb-4">404</div>
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-3">Page Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        The article or page you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/search"
          className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:border-brand-red transition-colors"
        >
          Search Articles
        </Link>
      </div>
    </div>
  )
}
