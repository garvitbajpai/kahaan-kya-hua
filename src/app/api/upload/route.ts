import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseExcelBuffer } from '@/lib/excel-parser'
import { generateSlug, generateCategorySlug } from '@/lib/slug'
import { getCategoryColor } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Auth check
  const token = req.cookies.get('admin_token')?.value
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const confirmImport = formData.get('confirm') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
    ]
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an .xlsx or .xls file' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { valid, errors } = parseExcelBuffer(buffer)

    // Phase 1: Preview mode — return parsed data without saving
    if (!confirmImport) {
      return NextResponse.json({
        preview: true,
        valid: valid.map((r) => ({
          rowNumber: r.rowNumber,
          headline: r.headline,
          category: r.categoryName,
          date: r.date.toISOString(),
          bodyPreview: r.body.slice(0, 120) + (r.body.length > 120 ? '...' : ''),
          language: r.language,
          priority: r.priority,
        })),
        errors,
        totalRows: valid.length + errors.length,
        validCount: valid.length,
        errorCount: errors.length,
      })
    }

    // Phase 2: Confirmed import — write to database
    if (valid.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows to import', errors },
        { status: 400 }
      )
    }

    // Gather unique categories
    const categoryNames = [...new Set(valid.map((r) => r.categoryName))]
    const allCategories = await prisma.category.findMany({
      where: { name: { in: categoryNames } },
    })
    const categoryMap = new Map(allCategories.map((c) => [c.name, c]))

    // Find existing category count for color assignment
    const existingCount = await prisma.category.count()

    // Create missing categories
    let colorIndex = existingCount
    for (const name of categoryNames) {
      if (!categoryMap.has(name)) {
        const slug = generateCategorySlug(name)
        const color = getCategoryColor(colorIndex++)
        const cat = await prisma.category.create({
          data: { name, slug, color },
        })
        categoryMap.set(name, cat)
      }
    }

    // Create upload history record first
    const uploadHistory = await prisma.uploadHistory.create({
      data: {
        filename: file.name,
        totalRows: valid.length + errors.length,
        successCount: 0,
        failureCount: errors.length,
        status: 'in_progress',
        errorLog: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    })

    // Insert articles
    let successCount = 0
    const insertErrors: Array<{ row: number; message: string }> = [...errors]

    for (const row of valid) {
      try {
        const category = categoryMap.get(row.categoryName)!
        const slug = generateSlug(row.headline)

        await prisma.article.create({
          data: {
            headline: row.headline,
            slug,
            body: row.body,
            publishedAt: row.date,
            categoryId: category.id,
            uploadId: uploadHistory.id,
            language: row.language ?? 'Hindi',
            priority: row.priority ?? null,
          },
        })
        successCount++
      } catch (err) {
        insertErrors.push({
          row: row.rowNumber,
          message: `Database insert failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        })
      }
    }

    // Update upload history
    const status =
      successCount === 0 ? 'failed' : insertErrors.length > errors.length ? 'partial' : 'completed'

    await prisma.uploadHistory.update({
      where: { id: uploadHistory.id },
      data: {
        successCount,
        failureCount: insertErrors.length,
        status,
        errorLog: insertErrors.length > 0 ? JSON.stringify(insertErrors) : null,
      },
    })

    return NextResponse.json({
      success: true,
      uploadId: uploadHistory.id,
      successCount,
      failureCount: insertErrors.length,
      errors: insertErrors,
      message: `Successfully imported ${successCount} articles${insertErrors.length > 0 ? ` (${insertErrors.length} failed)` : ''}`,
    })
  } catch (error) {
    console.error('POST /api/upload error:', error)
    return NextResponse.json(
      { error: 'Upload processing failed', details: String(error) },
      { status: 500 }
    )
  }
}
