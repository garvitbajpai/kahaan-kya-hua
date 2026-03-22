'use strict'
const router = require('express').Router()
const { prisma } = require('../lib/prisma')

// Ticker API
router.get('/ticker', async (req, res) => {
  try {
    const arts = await prisma.article.findMany({
      where: { isBreaking: true }, orderBy: { publishedAt: 'desc' }, take: 8,
      select: { headline: true, slug: true }
    })
    res.json(arts.length > 0 ? arts : await prisma.article.findMany({
      orderBy: { publishedAt: 'desc' }, take: 5, select: { headline: true, slug: true }
    }))
  } catch { res.json([]) }
})

// Search API (JSON)
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (q.length < 2) return res.json([])
    const results = await prisma.article.findMany({
      where: { OR: [{ headline: { contains: q } }, { body: { contains: q } }] },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { publishedAt: 'desc' }, take: 10,
      select: { headline: true, slug: true, publishedAt: true, category: true },
    })
    res.json(results)
  } catch { res.json([]) }
})

module.exports = router
