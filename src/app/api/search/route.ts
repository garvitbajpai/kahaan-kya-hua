import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const q = searchParams.get('q')?.trim() ?? ''
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 10

    if (!q || q.length < 2) {
      return NextResponse.json({ articles: [], total: 0, query: q })
    }

    const where = {
      OR: [
        { headline: { contains: q } },
        { body: { contains: q } },
        { category: { name: { contains: q } } },
      ],
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true, color: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])

    return NextResponse.json({
      articles,
      total,
      query: q,
      pages: Math.ceil(total / limit),
      page,
    })
  } catch (error) {
    console.error('GET /api/search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
