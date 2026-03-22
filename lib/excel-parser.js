'use strict'
const XLSX = require('xlsx')

exports.parseExcelBuffer = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return { valid: [], errors: [{ row: 0, message: 'Excel file has no sheets' }] }

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '', raw: false })
  if (rows.length === 0) return { valid: [], errors: [{ row: 0, message: 'Excel file has no data rows' }] }

  const headers = Object.keys(rows[0])
  const required = ['Date', 'News', 'Headline', 'Category']
  const missing = required.filter(h => !headers.some(k => k.trim().toLowerCase() === h.toLowerCase()))
  if (missing.length > 0) return { valid: [], errors: [{ row: 1, message: `Missing columns: ${missing.join(', ')}` }] }

  const getField = (row, field) => {
    const key = Object.keys(row).find(k => k.trim().toLowerCase() === field.toLowerCase())
    return key ? String(row[key] ?? '').trim() : ''
  }

  const valid = [], errors = []

  rows.forEach((row, i) => {
    const rowNum = i + 2
    const headline = getField(row, 'Headline')
    const body     = getField(row, 'News')
    const cat      = getField(row, 'Category')
    const rawDate  = getField(row, 'Date')
    const rawLang  = getField(row, 'Language')
    const rawPri   = getField(row, 'Priority')

    const errs = []
    if (!headline) errs.push('Headline is empty')
    if (headline.length > 300) errs.push('Headline exceeds 300 chars')
    if (!body) errs.push('News body is empty')
    if (!cat) errs.push('Category is empty')
    if (!rawDate) errs.push('Date is empty')

    const lang = rawLang ? rawLang : 'Hindi'
    if (rawLang && !['Hindi','English','hindi','english'].includes(rawLang))
      errs.push(`Invalid language "${rawLang}" — use Hindi or English`)
    const language = lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase()

    let priority = null
    if (rawPri && rawPri !== '') {
      const p = parseInt(rawPri, 10)
      if (isNaN(p) || p < 1 || p > 4) errs.push(`Invalid priority "${rawPri}" — must be 1–4`)
      else priority = p
    }

    const parsedDate = rawDate ? new Date(rawDate) : null
    if (parsedDate && isNaN(parsedDate.getTime())) {
      errs.push(`Invalid date: "${rawDate}"`)
    }

    if (errs.length > 0) { errs.forEach(m => errors.push({ row: rowNum, message: m })); return }

    valid.push({ date: parsedDate, headline, body, categoryName: cat, rowNumber: rowNum, language, priority })
  })

  return { valid, errors }
}
