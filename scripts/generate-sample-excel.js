/**
 * Run: node scripts/generate-sample-excel.js
 * Creates a sample-news.xlsx file in the project root for testing uploads.
 */

const XLSX = require('xlsx')
const path = require('path')

const data = [
  ['Date', 'Headline', 'News', 'Category'],
  [
    '2026-03-21',
    'Breaking: Parliament Passes Historic Climate Bill',
    'Parliament today passed a landmark climate bill that commits the nation to net-zero emissions by 2035. The legislation, which passed with a large majority, mandates a 60% reduction in carbon emissions over the next decade. The bill includes incentives for renewable energy adoption and penalties for high-emission industries.',
    'Politics',
  ],
  [
    '2026-03-21',
    'Tech Company Unveils Next-Gen Smartphone with AI Features',
    'The world leading smartphone manufacturer unveiled its latest flagship device featuring integrated artificial intelligence capabilities. The new phone includes a dedicated AI chip that can process tasks locally without cloud connectivity, improving both speed and privacy. The device will be available in stores next month.',
    'Technology',
  ],
  [
    '2026-03-20',
    'Central Bank Raises Interest Rates to Combat Inflation',
    'The central bank announced a 0.5% increase in the benchmark interest rate today, citing persistent inflation concerns. This marks the third consecutive rate hike this year. Economists predict the move will slow consumer spending but help bring inflation back to the 2% target by end of year.',
    'Business',
  ],
  [
    '2026-03-20',
    'National Football Team Qualifies for World Cup',
    'The national football team secured its place in the upcoming World Cup with a convincing 3-0 victory in last night\'s qualifier. Star midfielder scored twice in a dominant performance that delighted fans across the country. The team will now begin preparations for the tournament beginning in June.',
    'Sports',
  ],
  [
    '2026-03-19',
    'New Study Links Mediterranean Diet to Longer Lifespan',
    'Researchers at a top university published findings showing that adherence to a Mediterranean diet can extend lifespan by up to 8 years. The 20-year study tracked dietary habits and health outcomes of 50,000 participants. The diet, rich in olive oil, fish, and vegetables, showed particularly strong protective effects against heart disease.',
    'Health',
  ],
  [
    '2026-03-19',
    'International Peace Talks Resume After Three-Year Pause',
    'Representatives from three nations resumed peace negotiations today after a three-year hiatus. Mediators expressed cautious optimism following the opening session, noting a "constructive atmosphere" among the delegations. The talks are expected to continue for two weeks at a neutral venue.',
    'World',
  ],
  [
    '2026-03-18',
    'E-commerce Giant Reports Record Holiday Sales',
    'The country\'s largest e-commerce platform reported record-breaking sales figures for the holiday season, with revenue up 45% compared to the previous year. The company processed over 50 million orders in December alone. Mobile purchases accounted for 78% of all transactions, reflecting a major shift in consumer behavior.',
    'Business',
  ],
  [
    '2026-03-18',
    'Scientists Discover New Species in Amazon Rainforest',
    'A team of international researchers has discovered 12 previously unknown species of plants and insects in a remote section of the Amazon rainforest. The discovery highlights the biodiversity of the region and underscores the importance of conservation efforts. The new species include several that may have medicinal properties.',
    'World',
  ],
]

const wb = XLSX.utils.book_new()
const ws = XLSX.utils.aoa_to_sheet(data)

// Style column widths
ws['!cols'] = [
  { wch: 12 },  // Date
  { wch: 50 },  // Headline
  { wch: 80 },  // News
  { wch: 15 },  // Category
]

XLSX.utils.book_append_sheet(wb, ws, 'News')

const outputPath = path.join(__dirname, '..', 'sample-news.xlsx')
XLSX.writeFile(wb, outputPath)

console.log(`✅ Sample Excel file created: ${outputPath}`)
console.log(`   ${data.length - 1} articles across ${new Set(data.slice(1).map(r => r[3])).size} categories`)
