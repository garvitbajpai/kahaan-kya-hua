import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1')
    const limit = 20

    const [history, total] = await Promise.all([
      prisma.uploadHistory.findMany({
        orderBy: { uploadedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { articles: true } },
        },
      }),
      prisma.uploadHistory.count(),
    ])

    return NextResponse.json({ history, total, pages: Math.ceil(total / limit), page })
  } catch (error) {
    console.error('GET /api/upload-history error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
