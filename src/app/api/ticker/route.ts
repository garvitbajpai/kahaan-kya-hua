import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 30

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        headline: true,
        slug: true,
        isBreaking: true,
        category: { select: { name: true, slug: true } },
      },
      orderBy: [{ isBreaking: 'desc' }, { publishedAt: 'desc' }],
      take: 10,
    })
    return NextResponse.json(articles)
  } catch (error) {
    console.error('GET /api/ticker error:', error)
    return NextResponse.json({ error: 'Failed to fetch ticker' }, { status: 500 })
  }
}
