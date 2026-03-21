import * as XLSX from 'xlsx'
import type { ParseResult, ParsedRow } from '@/types'

export function parseExcelBuffer(buffer: Buffer): ParseResult {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = wb.SheetNames[0]

  if (!sheetName) {
    return { valid: [], errors: [{ row: 0, message: 'Excel file has no sheets' }] }
  }

  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: '',
    raw: false,
  })

  if (rows.length === 0) {
    return { valid: [], errors: [{ row: 0, message: 'Excel file has no data rows' }] }
  }

  // Validate headers
  const firstRow = rows[0]
  const headers = Object.keys(firstRow)
  const required = ['Date', 'News', 'Headline', 'Category']
  const missing = required.filter(
    (h) => !headers.some((k) => k.trim().toLowerCase() === h.toLowerCase())
  )
  if (missing.length > 0) {
    return {
      valid: [],
      errors: [{ row: 1, message: `Missing required columns: ${missing.join(', ')}` }],
    }
  }

  // Normalize header keys (case-insensitive lookup)
  function getField(row: Record<string, unknown>, field: string): string {
    const key = Object.keys(row).find((k) => k.trim().toLowerCase() === field.toLowerCase())
    return key ? String(row[key] ?? '').trim() : ''
  }

  const valid: ParsedRow[] = []
  const errors: Array<{ row: number; message: string }> = []

  rows.forEach((row, i) => {
    const rowNum = i + 2 // 1-indexed + header row offset
    const headline = getField(row, 'Headline')
    const body = getField(row, 'News')
    const categoryName = getField(row, 'Category')
    const rawDate = getField(row, 'Date')
    const rawLanguage = getField(row, 'Language')
    const rawPriority = getField(row, 'Priority')

    const rowErrors: string[] = []

    if (!headline) rowErrors.push('Headline is empty')
    if (headline.length > 300) rowErrors.push('Headline exceeds 300 characters')
    if (!body) rowErrors.push('News body is empty')
    if (!categoryName) rowErrors.push('Category is empty')
    if (!rawDate) rowErrors.push('Date is empty')

    // Validate language
    const language = rawLanguage && rawLanguage.length > 0 ? rawLanguage : 'Hindi'
    const validLanguages = ['Hindi', 'English', 'hindi', 'english']
    if (rawLanguage && !validLanguages.includes(rawLanguage)) {
      rowErrors.push(`Invalid language "${rawLanguage}" — use Hindi or English`)
    }
    const normalizedLanguage = language.charAt(0).toUpperCase() + language.slice(1).toLowerCase()

    // Validate priority (optional, 1-4)
    let priority: number | null = null
    if (rawPriority && rawPriority !== '') {
      const p = parseInt(rawPriority, 10)
      if (isNaN(p) || p < 1 || p > 4) {
        rowErrors.push(`Invalid priority "${rawPriority}" — must be 1, 2, 3, or 4`)
      } else {
        priority = p
      }
    }

    let parsedDate: Date | null = null
    if (rawDate) {
      parsedDate = new Date(rawDate)
      if (isNaN(parsedDate.getTime())) {
        rowErrors.push(`Invalid date format: "${rawDate}" — use YYYY-MM-DD or MM/DD/YYYY`)
        parsedDate = null
      }
    }

    if (rowErrors.length > 0) {
      rowErrors.forEach((msg) => errors.push({ row: rowNum, message: msg }))
      return
    }

    valid.push({
      date: parsedDate!,
      headline,
      body,
      categoryName,
      rowNumber: rowNum,
      language: normalizedLanguage,
      priority,
    })
  })

  return { valid, errors }
}
