'use strict'
require('dotenv').config()

const express = require('express')
const cookieParser = require('cookie-parser')
const path = require('path')

const app = express()

// ── View engine ──────────────────────────────────────────────
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// ── Middleware ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }))

// ── Routes ────────────────────────────────────────────────────
app.use('/', require('./routes/public'))
app.use('/admin', require('./routes/admin'))
app.use('/api', require('./routes/api'))

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', { title: '404 – Page Not Found', code: 404, message: 'The page you are looking for does not exist.' })
})

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err)
  res.status(500).render('error', { title: '500 – Server Error', code: 500, message: 'Something went wrong. Please try again.' })
})

// ── Start ─────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10)
app.listen(PORT, () => console.log(`✅ Kahaan Kya Hua running on port ${PORT}`))
