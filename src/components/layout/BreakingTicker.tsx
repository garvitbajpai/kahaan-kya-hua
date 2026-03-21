'use client'

import Link from 'next/link'
import useSWR from 'swr'

interface TickerItem {
  id: number
  headline: string
  slug: string
  isBreaking: boolean
  category: { name: string; slug: string }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function BreakingTicker() {
  const { data } = useSWR<TickerItem[]>('/api/ticker', fetcher, {
    refreshInterval: 30000,
  })

  if (!data || data.length === 0) return null

  const items = [...data, ...data] // duplicate for seamless loop

  return (
    <div className="bg-brand-red text-white overflow-hidden">
      <div className="flex items-stretch">
        {/* Label */}
        <div className="flex-shrink-0 bg-brand-navy px-4 py-2 flex items-center gap-2 z-10">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap hidden sm:block">
            ब्रेकिंग
          </span>
          <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap sm:hidden">
            🔴
          </span>
        </div>

        {/* Scrolling content */}
        <div className="overflow-hidden flex-1 py-2">
          <div className="flex animate-ticker whitespace-nowrap gap-12 items-center">
            {items.map((item, i) => (
              <Link
                key={`${item.id}-${i}`}
                href={`/article/${item.slug}`}
                className="text-sm font-medium hover:underline shrink-0"
              >
                <span className="opacity-75 mr-2">[{item.category.name}]</span>
                {item.headline}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
