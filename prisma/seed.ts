import { PrismaClient } from '@prisma/client'
import { generateSlug, generateCategorySlug } from '../src/lib/slug'

const prisma = new PrismaClient()

const categories = [
  { name: 'Politics', color: '#C0392B' },
  { name: 'Business', color: '#2980B9' },
  { name: 'Technology', color: '#27AE60' },
  { name: 'Sports', color: '#8E44AD' },
  { name: 'Health', color: '#E67E22' },
  { name: 'World', color: '#16A085' },
]

const headlines = [
  { headline: 'New Economic Policy Announced by Government', body: 'The government today announced a comprehensive new economic policy aimed at stimulating growth and reducing inflation. The policy includes tax cuts for small businesses, increased infrastructure spending, and new incentives for foreign investment. Economists have given mixed reactions, with some praising the growth-focused approach while others warn about potential deficit implications.', category: 'Politics' },
  { headline: 'Tech Giant Launches Revolutionary AI Product', body: 'A leading technology company unveiled its latest artificial intelligence product today, promising to transform how businesses operate. The new system can process complex data in real-time and provide actionable insights. Industry analysts predict this could disrupt multiple sectors including healthcare, finance, and logistics.', category: 'Technology' },
  { headline: 'National Team Wins Championship After 20 Years', body: 'In a thrilling final match, the national football team claimed the championship title for the first time in two decades. The team defeated their rivals 3-1 in front of a record crowd. The captain described it as the proudest moment of his career, and celebrations erupted across the country following the final whistle.', category: 'Sports' },
  { headline: 'Breakthrough Medical Research Could Save Millions', body: 'Scientists at a leading research university have announced a breakthrough in cancer treatment that could potentially save millions of lives worldwide. The new therapy targets cancer cells with unprecedented precision while leaving healthy tissue unharmed. Clinical trials are expected to begin next year.', category: 'Health' },
  { headline: 'Global Summit Addresses Climate Emergency', body: 'World leaders gathered today for an emergency climate summit to discuss accelerated action on reducing carbon emissions. Representatives from over 150 countries signed a new agreement pledging to achieve carbon neutrality by 2040. Environmental groups called it a historic step forward.', category: 'World' },
  { headline: 'Stock Market Hits Record High Amid Economic Optimism', body: 'The stock market reached an all-time high today as investors responded positively to strong quarterly earnings reports and encouraging economic data. The gains were broad-based, with technology, healthcare, and consumer sectors all posting significant increases. Analysts say the rally reflects growing confidence in the economic recovery.', category: 'Business' },
  { headline: 'Major Infrastructure Bill Passes Legislature', body: 'After months of debate, the legislature passed a landmark infrastructure bill that will fund repairs and upgrades to roads, bridges, and public transportation across the country. The $500 billion package is expected to create hundreds of thousands of jobs and modernize aging infrastructure built decades ago.', category: 'Politics', isBreaking: true },
  { headline: 'Startup Raises Record Funding Round', body: 'A fast-growing technology startup raised an unprecedented $2 billion in its latest funding round, valuing the company at $15 billion. The funds will be used to expand operations globally and accelerate product development. The company, known for its innovative supply chain software, has seen 300% growth in the past year.', category: 'Business' },
]

async function main() {
  console.log('🌱 Starting seed...')

  // Create categories
  const categoryMap = new Map<string, number>()
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: generateCategorySlug(cat.name) },
      update: {},
      create: {
        name: cat.name,
        slug: generateCategorySlug(cat.name),
        color: cat.color,
      },
    })
    categoryMap.set(cat.name, created.id)
    console.log(`  ✓ Category: ${cat.name}`)
  }

  // Create articles
  for (const item of headlines) {
    const categoryId = categoryMap.get(item.category)!
    const slug = generateSlug(item.headline)
    const daysAgo = Math.floor(Math.random() * 30)
    const publishedAt = new Date(Date.now() - daysAgo * 86400000)

    await prisma.article.create({
      data: {
        headline: item.headline,
        slug,
        body: item.body,
        publishedAt,
        categoryId,
        isFeatured: item.headline.includes('Global') ? true : false,
        isBreaking: 'isBreaking' in item ? item.isBreaking : false,
      },
    })
    console.log(`  ✓ Article: ${item.headline.slice(0, 50)}...`)
  }

  console.log(`\n✅ Seed complete! ${headlines.length} articles created across ${categories.length} categories.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
