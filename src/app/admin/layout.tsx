import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const token = cookieStore.get('admin_token')?.value

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-navy text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-2 flex-shrink-0">
              <Image src="/logo.svg" alt="KKH" width={36} height={29} className="object-contain" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">कहाँ क्या हुआ</div>
              <div className="text-[10px] text-blue-300 uppercase tracking-widest">Admin Panel</div>
            </div>
          </Link>
        </div>

        <nav className="p-4 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 px-2">
            Navigation
          </p>
          <ul className="space-y-1">
            {[
              { href: '/admin', label: 'Dashboard', icon: '📊' },
              { href: '/admin/upload', label: 'Upload Excel', icon: '📤' },
              { href: '/admin/articles', label: 'Manage Articles', icon: '📰' },
              { href: '/admin/history', label: 'Upload History', icon: '📋' },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 px-2">
              Website
            </p>
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <span>🌐</span> View Website
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            href="/api/auth"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
          >
            <span>🚪</span> Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="md:hidden bg-brand-navy text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="KKH" width={28} height={22} className="object-contain" />
            <span className="font-bold text-sm">KKH Admin</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/admin/upload" className="text-gray-300 hover:text-white">Upload</Link>
            <Link href="/admin/articles" className="text-gray-300 hover:text-white">Articles</Link>
            <Link href="/admin/history" className="text-gray-300 hover:text-white">History</Link>
            <Link href="/" className="text-gray-300 hover:text-white">Site</Link>
          </div>
        </div>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
