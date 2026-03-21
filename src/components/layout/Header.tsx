'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { formatDateShort } from '@/lib/slug'

interface Category {
  id: number
  name: string
  slug: string
  color: string | null
}

interface HeaderProps {
  categories?: Category[]
}

export function Header({ categories = [] }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [lang, setLang] = useState<'Hindi' | 'English'>('Hindi')

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler)

    // Restore language preference
    const saved = localStorage.getItem('kkh_lang') as 'Hindi' | 'English' | null
    if (saved) setLang(saved)

    return () => window.removeEventListener('scroll', handler)
  }, [])

  const toggleLang = () => {
    const next = lang === 'Hindi' ? 'English' : 'Hindi'
    setLang(next)
    localStorage.setItem('kkh_lang', next)
    // Dispatch custom event so other components can react
    window.dispatchEvent(new CustomEvent('langChange', { detail: next }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQ.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQ.trim())}&lang=${lang}`
    }
  }

  return (
    <>
      {/* Top utility bar */}
      <div className="bg-brand-navy text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden sm:flex items-center gap-2 text-blue-200">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDateShort(new Date())}
          </span>
          <span className="font-bold tracking-widest uppercase text-white text-xs">
            कहाँ क्या हुआ · Kahaan Kya Hua
          </span>
          <Link
            href="/admin"
            className="text-blue-200 hover:text-white transition-colors text-xs flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin
          </Link>
        </div>
      </div>

      {/* Main header */}
      <header
        className={`bg-white border-b-2 border-brand-navy sticky top-0 z-50 transition-shadow ${
          scrolled ? 'shadow-lg' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="relative w-12 h-10 md:w-16 md:h-13">
                <Image
                  src="/logo.svg"
                  alt="Kahaan Kya Hua Logo"
                  width={64}
                  height={52}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <div className="text-lg md:text-xl font-serif font-bold text-brand-navy leading-tight">
                  कहाँ क्या हुआ
                </div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                  Kahaan Kya Hua
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              <Link
                href="/"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-red hover:bg-red-50 transition-colors rounded-lg"
              >
                Home
              </Link>
              {categories.slice(0, 7).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-red hover:bg-red-50 transition-colors rounded-lg"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Language switcher */}
              <button
                onClick={toggleLang}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border-2 ${
                  lang === 'Hindi'
                    ? 'bg-brand-saffron text-white border-brand-saffron'
                    : 'bg-brand-navy text-white border-brand-navy'
                }`}
                title={`Switch to ${lang === 'Hindi' ? 'English' : 'Hindi'}`}
              >
                {lang === 'Hindi' ? (
                  <>
                    <span>हिं</span>
                    <span className="text-white/70">|</span>
                    <span className="text-white/60 font-normal normal-case">EN</span>
                  </>
                ) : (
                  <>
                    <span className="text-white/60 font-normal">हिं</span>
                    <span className="text-white/70">|</span>
                    <span>EN</span>
                  </>
                )}
              </button>

              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-gray-600 hover:text-brand-red hover:bg-red-50 transition-colors rounded-lg"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Mobile menu */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-brand-red hover:bg-red-50 transition-colors rounded-lg"
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div className="pb-4 animate-fade-in">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="search"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder={lang === 'Hindi' ? 'खबरें खोजें...' : 'Search news, topics...'}
                  autoFocus
                  className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-200 rounded-full focus:outline-none focus:border-brand-red transition-colors"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-red text-white text-sm rounded-full hover:bg-red-700 transition-colors font-medium"
                >
                  {lang === 'Hindi' ? 'खोजें' : 'Search'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white animate-fade-in">
            <div className="px-4 py-3 space-y-1 max-h-[60vh] overflow-y-auto">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-brand-red hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-brand-red hover:bg-red-50 rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color ?? '#D32F2F' }}
                  />
                  {cat.name}
                </Link>
              ))}

              {/* Mobile lang switcher */}
              <div className="pt-2 pb-1 border-t border-gray-100 mt-2">
                <button
                  onClick={() => { toggleLang(); setMenuOpen(false) }}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                    lang === 'Hindi'
                      ? 'bg-orange-50 text-brand-saffron border border-orange-200'
                      : 'bg-blue-50 text-brand-navy border border-blue-200'
                  }`}
                >
                  {lang === 'Hindi' ? '🇮🇳 Switch to English' : '🇮🇳 हिंदी में पढ़ें'}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Category nav strip */}
      {categories.length > 0 && (
        <div className="bg-brand-navy text-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className={`flex-shrink-0 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-blue-200 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap ${
                    i === 0 ? 'border-l border-white/10' : ''
                  } border-r border-white/10`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
