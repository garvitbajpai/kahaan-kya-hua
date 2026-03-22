'use strict'
const { randomBytes } = require('crypto')

const CATEGORY_COLORS = [
  '#C0392B','#2980B9','#27AE60','#8E44AD',
  '#E67E22','#16A085','#D35400','#2C3E50',
  '#1ABC9C','#E74C3C','#3498DB','#F39C12',
]
exports.getCategoryColor = (index) => CATEGORY_COLORS[index % CATEGORY_COLORS.length]

exports.generateSlug = (text) => {
  const base = text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)
  return `${base}-${randomBytes(3).toString('hex')}`
}

exports.generateCategorySlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-')

exports.formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })

exports.formatDateShort = (date) =>
  new Date(date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })

exports.timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return exports.formatDateShort(date)
}

exports.getReadTime = (text) => Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200))

exports.HOME_LATEST_COUNT = 9
exports.CATEGORY_PREVIEW_COUNT = 4
exports.ARTICLES_PER_PAGE = 12
exports.RELATED_COUNT = 3

exports.priorityLabel = (p) => ({1:'TOP STORY',2:'FEATURED',3:'HIGHLIGHT',4:'TRENDING'}[p] ?? 'NEWS')
exports.priorityBg    = (p) => ({1:'#DC2626',2:'#F97316',3:'#EAB308',4:'#3B82F6'}[p] ?? '#6B7280')
