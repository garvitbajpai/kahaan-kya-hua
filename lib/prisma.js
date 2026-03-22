'use strict'
const { PrismaClient } = require('@prisma/client')

let prisma
if (global.__prisma) {
  prisma = global.__prisma
} else {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
  global.__prisma = prisma
}

module.exports = { prisma }
