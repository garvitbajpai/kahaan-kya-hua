import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BreakingTicker } from '@/components/layout/BreakingTicker'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: {
    default: 'Kahaan Kya Hua | कहाँ क्या हुआ',
    template: `%s | Kahaan Kya Hua`,
  },
  description: 'भारत और दुनिया की ताज़ा खबरें। Breaking news, latest updates in Hindi & English.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'Kahaan Kya Hua',
  },
}

async function getCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, color: true },
    })
  } catch {
    return []
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const categories = await getCategories()

  return (
    <html lang="hi">
      <body>
        <Header categories={categories} />
        <BreakingTicker />
        <main className="min-h-screen">{children}</main>
        <Footer categories={categories} />
      </body>
    </html>
  )
}
