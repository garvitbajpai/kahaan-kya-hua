'use strict'
const router = require('express').Router()
const multer = require('multer')
const { prisma } = require('../lib/prisma')
const h = require('../lib/helpers')
const { parseExcelBuffer } = require('../lib/excel-parser')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// ── Auth middleware ───────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = req.cookies?.admin_token
  if (!token || token !== process.env.ADMIN_SECRET) {
    return res.redirect(`/admin/login?redirect=${encodeURIComponent(req.path)}`)
  }
  next()
}

// ── LOGIN GET ─────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.cookies?.admin_token === process.env.ADMIN_SECRET)
    return res.redirect('/admin')
  res.render('admin/login', { title: 'Admin Login | Kahaan Kya Hua', error: null, redirect: req.query.redirect || '/admin' })
})

// ── LOGIN POST ────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { password, redirect } = req.body
  if (password !== process.env.ADMIN_SECRET) {
    return res.render('admin/login', { title: 'Admin Login | Kahaan Kya Hua', error: 'Invalid password. Please try again.', redirect: redirect || '/admin' })
  }
  res.cookie('admin_token', process.env.ADMIN_SECRET, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
  })
  res.redirect(redirect || '/admin')
})

// ── LOGOUT ────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  res.clearCookie('admin_token')
  res.redirect('/admin/login')
})

// ── Protect all routes below ──────────────────────────────────
router.use(requireAuth)

// ── DASHBOARD ─────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const articleCount  = await prisma.article.count()
    const categoryCount = await prisma.category.count()
    const hindiCount    = await prisma.article.count({ where: { language: 'Hindi' } })
    const uploadCount   = await prisma.uploadHistory.count()
    const recentUploads = await prisma.uploadHistory.findMany({ orderBy: { uploadedAt: 'desc' }, take: 5 })
    const recentArticles = await prisma.article.findMany({
      include: { category: { select: { name:true, color:true } } },
      orderBy: { publishedAt: 'desc' }, take: 10,
    })
    res.render('admin/dashboard', {
      title: 'Dashboard | Admin', h,
      stats: { articleCount, categoryCount, hindiCount, uploadCount },
      recentUploads, recentArticles,
    })
  } catch (err) { next(err) }
})

// ── UPLOAD GET ────────────────────────────────────────────────
router.get('/upload', (req, res) => {
  res.render('admin/upload', { title: 'Upload Excel | Admin', h, flash: req.query.flash || null })
})

// ── UPLOAD POST (preview or confirm) ─────────────────────────
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const confirm = req.body.confirm === 'true'

    // Confirmation step uses previewData JSON stored in hidden field
    if (confirm && req.body.previewData) {
      let rows
      try { rows = JSON.parse(req.body.previewData) } catch { rows = [] }
      const filename = req.body.filename || 'upload.xlsx'

      if (rows.length === 0)
        return res.render('admin/upload', { title: 'Upload Excel | Admin', h, flash: 'No valid rows to import.' })

      const categoryNames = [...new Set(rows.map(r => r.categoryName))]
      const existing = await prisma.category.findMany({ where: { name: { in: categoryNames } } })
      const categoryMap = new Map(existing.map(c => [c.name, c]))
      let colorIndex = await prisma.category.count()

      for (const name of categoryNames) {
        if (!categoryMap.has(name)) {
          const cat = await prisma.category.create({
            data: { name, slug: h.generateCategorySlug(name), color: h.getCategoryColor(colorIndex++) }
          })
          categoryMap.set(name, cat)
        }
      }

      const uploadRec = await prisma.uploadHistory.create({
        data: { filename, totalRows: rows.length, successCount: 0, failureCount: 0, status: 'in_progress', errorLog: null }
      })

      let successCount = 0; const insertErrors = []
      for (const row of rows) {
        try {
          await prisma.article.create({
            data: {
              headline: row.headline, slug: h.generateSlug(row.headline),
              body: row.body, publishedAt: new Date(row.date),
              categoryId: categoryMap.get(row.categoryName).id,
              uploadId: uploadRec.id,
              language: row.language ?? 'Hindi',
              priority: row.priority ?? null,
            }
          })
          successCount++
        } catch (e) {
          insertErrors.push({ row: row.rowNumber, message: e.message })
        }
      }

      const status = successCount === 0 ? 'failed' : insertErrors.length > 0 ? 'partial' : 'completed'
      await prisma.uploadHistory.update({
        where: { id: uploadRec.id },
        data: { successCount, failureCount: insertErrors.length, status, errorLog: insertErrors.length > 0 ? JSON.stringify(insertErrors) : null }
      })
      return res.redirect(`/admin/history?flash=Imported+${successCount}+articles+successfully`)
    }

    if (!req.file) return res.render('admin/upload', { title: 'Upload Excel | Admin', h, flash: 'No file uploaded.' })

    if (!req.file.originalname.match(/\.(xlsx|xls)$/i)) {
      return res.render('admin/upload', { title: 'Upload Excel | Admin', h, flash: 'Please upload an .xlsx or .xls file.' })
    }

    const { valid, errors } = parseExcelBuffer(req.file.buffer)

    if (!confirm) {
      // Preview mode
      return res.render('admin/upload-preview', {
        title: 'Upload Preview | Admin', h,
        filename: req.file.originalname,
        valid: valid.map(r => ({
          rowNumber: r.rowNumber, headline: r.headline, categoryName: r.categoryName,
          date: r.date ? r.date.toISOString() : new Date().toISOString(),
          bodyPreview: r.body.slice(0, 100) + (r.body.length > 100 ? '…' : ''),
          body: r.body, language: r.language, priority: r.priority,
        })),
        errors, validCount: valid.length, errorCount: errors.length,
      })
    }

    // File was uploaded but confirm was not set — redirect to preview
    return res.redirect('/admin/upload')
  } catch (err) { next(err) }
})

// ── ARTICLES ──────────────────────────────────────────────────
router.get('/articles', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const lang = req.query.lang || ''
    const cat  = req.query.cat  || ''
    const q    = req.query.q    || ''
    const where = {}
    if (lang) where.language = lang
    if (cat)  where.categoryId = parseInt(cat)
    if (q)    where.OR = [{ headline: { contains: q } }, { body: { contains: q } }]

    const [articles, total, categories] = await Promise.all([
      prisma.article.findMany({
        where, include: { category: { select: { id:true, name:true, color:true } } },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * h.ARTICLES_PER_PAGE, take: h.ARTICLES_PER_PAGE,
      }),
      prisma.article.count({ where }),
      prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id:true, name:true } }),
    ])

    res.render('admin/articles', {
      title: 'Manage Articles | Admin', h, articles, categories,
      page, totalPages: Math.ceil(total / h.ARTICLES_PER_PAGE), total,
      filters: { lang, cat, q }, flash: req.query.flash || null,
    })
  } catch (err) { next(err) }
})

// ── DELETE ARTICLE ────────────────────────────────────────────
router.post('/articles/:id/delete', async (req, res, next) => {
  try {
    await prisma.article.delete({ where: { id: parseInt(req.params.id) } })
    res.redirect('/admin/articles?flash=Article+deleted')
  } catch (err) { next(err) }
})

// ── HISTORY ───────────────────────────────────────────────────
router.get('/history', async (req, res, next) => {
  try {
    const history = await prisma.uploadHistory.findMany({ orderBy: { uploadedAt: 'desc' }, take: 50 })
    res.render('admin/history', { title: 'Upload History | Admin', h, history, flash: req.query.flash || null })
  } catch (err) { next(err) }
})

// ── DELETE UPLOAD HISTORY ─────────────────────────────────────
router.post('/history/:id/delete', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.article.updateMany({ where: { uploadId: id }, data: { uploadId: null } })
    await prisma.uploadHistory.delete({ where: { id } })
    res.redirect('/admin/history?flash=Upload+record+deleted')
  } catch (err) { next(err) }
})

module.exports = router
