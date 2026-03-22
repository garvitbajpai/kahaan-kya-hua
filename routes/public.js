'use strict'
const router = require('express').Router()
const { prisma } = require('../lib/prisma')
const h = require('../lib/helpers')

// ── helpers ───────────────────────────────────────────────────
async function getCategories() {
  try { return await prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id:true, name:true, slug:true, color:true } }) }
  catch { return [] }
}

async function getTickerHeadlines() {
  try {
    const arts = await prisma.article.findMany({
      where: { isBreaking: true }, orderBy: { publishedAt: 'desc' }, take: 8,
      select: { headline:true, slug:true }
    })
    if (arts.length === 0) {
      return (await prisma.article.findMany({ orderBy: { publishedAt: 'desc' }, take: 5, select: { headline:true, slug:true } }))
    }
    return arts
  } catch { return [] }
}

function todayRange() {
  const now = new Date()
  return {
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
    end:   new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
  }
}

// ── HOME ──────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const [categories, ticker] = await Promise.all([getCategories(), getTickerHeadlines()])
    const { start, end } = todayRange()

    const todayPriority = await prisma.article.findMany({
      where: { priority: { not: null }, publishedAt: { gte: start, lte: end } },
      include: { category: { select: { id:true, name:true, slug:true, color:true } } },
      orderBy: [{ priority:'asc' }, { publishedAt:'desc' }], take: 6,
    })
    const latest = await prisma.article.findMany({
      include: { category: { select: { id:true, name:true, slug:true, color:true } } },
      orderBy: { publishedAt: 'desc' }, take: h.HOME_LATEST_COUNT,
    })
    const categorySections = await prisma.category.findMany({
      include: {
        articles: {
          include: { category: { select: { id:true, name:true, slug:true, color:true } } },
          orderBy: { publishedAt: 'desc' }, take: h.CATEGORY_PREVIEW_COUNT,
        }
      }, orderBy: { name: 'asc' },
    })
    const stats = {
      articleCount:  await prisma.article.count(),
      categoryCount: await prisma.category.count(),
      hindiCount:    await prisma.article.count({ where: { language: 'Hindi' } }),
      uploadCount:   await prisma.uploadHistory.count(),
    }

    const priority1   = todayPriority.find(a => a.priority === 1) ?? null
    const priority2s  = todayPriority.filter(a => a.priority === 2)
    const priority34s = todayPriority.filter(a => (a.priority ?? 0) >= 3)
    const heroArticle = priority1 ?? latest[0] ?? null
    const priorityIds = new Set(todayPriority.map(a => a.id))
    const gridArticles = latest.filter(a => a.id !== heroArticle?.id && !priorityIds.has(a.id)).slice(0, 8)
    const sideLatest   = latest.filter(a => a.id !== heroArticle?.id).slice(0, 6)

    res.render('home', {
      title: 'Kahaan Kya Hua | कहाँ क्या हुआ – ताज़ा खबरें',
      categories, ticker, h,
      latest, heroArticle, priority1, priority2s, priority34s,
      gridArticles, sideLatest, categorySections, stats,
    })
  } catch (err) { next(err) }
})

// ── ARTICLE ───────────────────────────────────────────────────
router.get('/article/:slug', async (req, res, next) => {
  try {
    const [categories, ticker] = await Promise.all([getCategories(), getTickerHeadlines()])
    const article = await prisma.article.findUnique({
      where: { slug: req.params.slug },
      include: { category: { select: { id:true, name:true, slug:true, color:true } } },
    })
    if (!article) return res.status(404).render('error', { title:'Article Not Found', code:404, message:'This article does not exist.' })

    const related = await prisma.article.findMany({
      where: { categoryId: article.categoryId, id: { not: article.id } },
      include: { category: { select: { id:true, name:true, slug:true, color:true } } },
      orderBy: { publishedAt: 'desc' }, take: h.RELATED_COUNT,
    })

    // Increment view count (fire and forget)
    prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

    res.render('article', { title: article.headline + ' | Kahaan Kya Hua', categories, ticker, h, article, related })
  } catch (err) { next(err) }
})

// ── CATEGORY ──────────────────────────────────────────────────
router.get('/category/:slug', async (req, res, next) => {
  try {
    const [categories, ticker] = await Promise.all([getCategories(), getTickerHeadlines()])
    const category = await prisma.category.findUnique({ where: { slug: req.params.slug } })
    if (!category) return res.status(404).render('error', { title:'Category Not Found', code:404, message:'This category does not exist.' })

    const page = Math.max(1, parseInt(req.query.page) || 1)
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: { categoryId: category.id },
        include: { category: { select: { id:true, name:true, slug:true, color:true } } },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * h.ARTICLES_PER_PAGE,
        take: h.ARTICLES_PER_PAGE,
      }),
      prisma.article.count({ where: { categoryId: category.id } }),
    ])

    res.render('category', {
      title: `${category.name} | Kahaan Kya Hua`,
      categories, ticker, h, category, articles,
      page, totalPages: Math.ceil(total / h.ARTICLES_PER_PAGE), total,
    })
  } catch (err) { next(err) }
})

// ── SEARCH ────────────────────────────────────────────────────
router.get('/search', async (req, res, next) => {
  try {
    const [categories, ticker] = await Promise.all([getCategories(), getTickerHeadlines()])
    const q = (req.query.q || '').toString().trim()
    let results = []
    if (q.length >= 2) {
      results = await prisma.article.findMany({
        where: {
          OR: [
            { headline: { contains: q } },
            { body:     { contains: q } },
          ],
        },
        include: { category: { select: { id:true, name:true, slug:true, color:true } } },
        orderBy: { publishedAt: 'desc' },
        take: 20,
      })
    }
    res.render('search', { title: q ? `Search: ${q} | Kahaan Kya Hua` : 'Search | Kahaan Kya Hua', categories, ticker, h, q, results })
  } catch (err) { next(err) }
})

module.exports = router
