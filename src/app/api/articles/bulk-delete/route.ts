import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// DELETE /api/articles/bulk-delete
// Body: { date: "YYYY-MM-DD" } to delete all articles published on that date
// Body: { ids: [1,2,3] } to delete specific articles by id
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Day-wise delete
    if (body.date) {
      const date = new Date(body.date)
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
      }

      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)

      const { count } = await prisma.article.deleteMany({
        where: {
          publishedAt: { gte: start, lte: end },
        },
      })

      return NextResponse.json({ success: true, deleted: count, type: 'day' })
    }

    // Bulk delete by ids
    if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
      const { count } = await prisma.article.deleteMany({
        where: { id: { in: body.ids.map(Number) } },
      })
      return NextResponse.json({ success: true, deleted: count, type: 'ids' })
    }

    return NextResponse.json({ error: 'Provide either date or ids' }, { status: 400 })
  } catch (error) {
    console.error('DELETE /api/articles/bulk-delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
