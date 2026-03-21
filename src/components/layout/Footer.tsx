import Link from 'next/link'
import Image from 'next/image'

interface Category {
  id: number
  name: string
  slug: string
}

interface FooterProps {
  categories?: Category[]
}

export function Footer({ categories = [] }: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'linear-gradient(135deg, #1A237E 0%, #0D0D0D 100%)' }} className="text-gray-400 mt-16">
      {/* Top footer band */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white rounded-xl p-2.5">
                  <Image src="/logo.svg" alt="Kahaan Kya Hua" width={44} height={36} className="object-contain" />
                </div>
                <div>
                  <div className="text-xl font-serif font-bold text-white">कहाँ क्या हुआ</div>
                  <div className="text-[10px] text-blue-300 uppercase tracking-widest">Kahaan Kya Hua</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-400 max-w-sm">
                भारत की विश्वसनीय खबर। हिंदी और English में ताज़ा समाचार, ब्रेकिंग न्यूज़ और गहन विश्लेषण।
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Trusted news from India — in Hindi &amp; English.
              </p>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">
                श्रेणियाँ / Categories
              </h3>
              <ul className="space-y-2">
                {categories.slice(0, 8).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1 h-1 bg-brand-red rounded-full" />
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">
                Quick Links
              </h3>
              <ul className="space-y-2">
                {[
                  { href: '/', label: 'Home / होम' },
                  { href: '/search', label: 'Search / खोजें' },
                  { href: '/admin', label: 'Admin Panel' },
                  { href: '/admin/upload', label: 'Upload Excel' },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-brand-gold rounded-full" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Language badge */}
              <div className="mt-5 flex items-center gap-2">
                <span className="bg-orange-600/20 text-orange-400 text-xs px-2.5 py-1 rounded-full font-bold border border-orange-600/30">
                  हिंदी
                </span>
                <span className="bg-blue-600/20 text-blue-400 text-xs px-2.5 py-1 rounded-full font-bold border border-blue-600/30">
                  English
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            &copy; {year} Kahaan Kya Hua (कहाँ क्या हुआ). All rights reserved.
          </p>
          <p className="text-xs text-gray-600">Powered by Next.js &amp; Prisma</p>
        </div>
      </div>
    </footer>
  )
}
