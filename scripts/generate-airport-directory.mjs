import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))
const airportRoot = join(repositoryRoot, 'docs/blog/机场')
const reviewDirectories = ['机场详情', '更新机场'].map(name => join(airportRoot, name))
const mainArticleFile = join(airportRoot, '2026年性价比翻墙机场推荐评测（长期更新）.md')
const outputFile = join(repositoryRoot, 'docs/.vuepress/theme/data/airportDirectory.generated.ts')
const defaultNote = '套餐资料见原评测；价格、流量周期及设备限制需核对。'

const stableCompare = (left, right) => left < right ? -1 : left > right ? 1 : 0

const collectMarkdown = directory => readdirSync(directory, { withFileTypes: true })
  .sort((left, right) => stableCompare(left.name, right.name))
  .flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return []
    const path = join(directory, entry.name)
    return entry.isDirectory() ? collectMarkdown(path) : entry.name.endsWith('.md') ? [path] : []
  })

const readDocument = file => {
  const raw = readFileSync(file, 'utf8')
  const parsed = matter(raw)
  return { file, raw, frontmatter: parsed.matter, data: parsed.data, content: parsed.content }
}

// Keep the date written in the source, including its local calendar day.
// Parsing an unquoted YAML timestamp as a Date first could shift that day to UTC.
const getSourceDate = document => {
  for (const [field, kind] of [['updated', 'updated'], ['createTime', 'published']]) {
    const scalar = document.frontmatter.match(new RegExp(`^${field}:\\s*([^\\r\\n]+)`, 'm'))?.[1]
    const match = scalar?.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
    if (!match) continue
    const [, year, month, day] = match
    const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    const checked = new Date(`${date}T00:00:00Z`)
    if (!Number.isNaN(checked.getTime()) && checked.toISOString().slice(0, 10) === date) {
      return { sourceDate: date, sourceDateKind: kind }
    }
  }
  throw new Error(`Missing valid updated/createTime in ${relative(repositoryRoot, document.file)}`)
}

const stripMarkup = value => String(value)
  .replace(/<br\s*\/?\s*>/gi, ' ')
  .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
  .replace(/<[^>]+>/g, '')
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/(?:\*\*|__|~~|`)/g, '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/\s+/g, ' ')
  .trim()

const getAirportName = title => {
  const text = stripMarkup(title)
    .replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '')
    .replace(/^【[^】]*】\s*/, '')
  const airportIndex = text.indexOf('机场')
  const name = (airportIndex > 0 ? text.slice(0, airportIndex) : text.split(/[｜|：:]/)[0]).trim()
  if (!name) throw new Error(`Cannot derive airport name from title: ${title}`)
  return name
}

const normalizeName = value => value.normalize('NFKC').toLowerCase()
  .replace(/\([^)]*\)/g, '')
  .replace(/机场$/, '')
  .replace(/[^\p{L}\p{N}]/gu, '')

const getPermalink = document => {
  const permalink = document.data.permalink
  if (typeof permalink !== 'string' || !permalink.startsWith('/')) {
    throw new Error(`Missing local permalink in ${relative(repositoryRoot, document.file)}`)
  }
  return permalink.trim()
}

const getLinks = text => [
  ...Array.from(text.matchAll(/\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g), match => ({
    label: stripMarkup(match[1]),
    href: match[2],
  })),
  ...Array.from(text.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi), match => ({
    label: stripMarkup(match[2]),
    href: match[1],
  })),
]

const splitTableRow = line => line.trim().replace(/^\|/, '').replace(/\|$/, '')
  .split(/(?<!\\)\|/)
  .map(cell => cell.replace(/\\\|/g, '|').trim())

const getShortlistRows = document => {
  const lines = document.content.split(/\r?\n/)
  const headingIndex = lines.findIndex(line => /^##\s/.test(line) && line.includes('{#airport-shortlist}'))
  if (headingIndex < 0) throw new Error('Cannot find the airport-shortlist heading in the main article')
  const tableLines = []
  let started = false
  for (const line of lines.slice(headingIndex + 1)) {
    if (/^\s*\|/.test(line)) {
      started = true
      tableLines.push(line)
    }
    else if (started || /^##\s/.test(line)) break
  }
  if (tableLines.length < 3) throw new Error('The airport-shortlist table has no records')
  const headers = splitTableRow(tableLines[0]).map(stripMarkup)
  const nameIndex = headers.findIndex(value => value === '机场名称')
  const priceIndex = headers.findIndex(value => value === '入门套餐')
  const detailIndex = headers.findIndex(value => value === '详情信息')
  if ([nameIndex, priceIndex, detailIndex].some(index => index < 0)) {
    throw new Error('The airport-shortlist table must have 机场名称、入门套餐、详情信息 columns')
  }
  return tableLines.slice(2).map(line => {
    const cells = splitTableRow(line)
    if (cells.length !== headers.length) throw new Error(`Unexpected shortlist table cell count: ${line}`)
    const nameLink = getLinks(cells[nameIndex])[0]
    const name = nameLink?.label || stripMarkup(cells[nameIndex])
    const links = getLinks(cells[detailIndex]).filter(link => link.href.startsWith('/'))
    return { name, anchor: nameLink?.href, priceDescription: stripMarkup(cells[priceIndex]), links }
  })
}

const makeRecord = (document, sourcePath, airportName, identitySeed = sourcePath) => {
  const hash = createHash('sha256').update(identitySeed).digest('hex').slice(0, 12)
  return {
    id: `directory-${hash}`,
    airportId: `airport-${hash}`,
    airportName,
    name: '套餐资料待核对',
    monthlyPrice: null,
    monthlyDataGB: null,
    sourcePath,
    ...getSourceDate(document),
    deviceLimit: '待确认',
    note: defaultNote,
  }
}

const mainArticle = readDocument(mainArticleFile)
const mainPermalink = getPermalink(mainArticle)
const reviewDocuments = reviewDirectories.flatMap(collectMarkdown).map(readDocument)
const rows = getShortlistRows(mainArticle)
const recordsByPath = new Map()
const documentsByPath = new Map([[mainPermalink, mainArticle]])
const recordsByName = new Map()

for (const document of reviewDocuments) {
  const path = getPermalink(document)
  if (recordsByPath.has(path)) throw new Error(`Duplicate review permalink: ${path}`)
  const record = makeRecord(document, path, getAirportName(document.data.title))
  recordsByPath.set(path, record)
  documentsByPath.set(path, document)
  const name = normalizeName(record.airportName)
  if (recordsByName.has(name)) throw new Error(`Ambiguous airport name: ${record.airportName}`)
  recordsByName.set(name, record)
}

// These table links point at risk notices, rather than their existing review pages.
// Keep one airport record and attach the notice to it; do not turn notices into extra providers.
const riskReviewPaths = {
  '/scamvpn/naiyunyujing/': '/article/naiyun/',
  '/scamvpn/yinyunyujing/': '/article/yinyun/',
  '/scamvpn/OKANCyujing/': '/article/OKANC/',
}

const extraDocuments = collectMarkdown(join(repositoryRoot, 'docs/blog/跑路机场')).map(readDocument)
for (const document of extraDocuments) {
  if (typeof document.data.permalink === 'string') documentsByPath.set(getPermalink(document), document)
}

let mainOnlyCount = 0
for (const row of rows) {
  const reviewLink = row.links.find(link => recordsByPath.has(link.href))
  const riskLink = row.links.find(link => link.href.startsWith('/scamvpn/'))
  const explicitReviewPath = riskLink && riskReviewPaths[riskLink.href]
  let record = (reviewLink && recordsByPath.get(reviewLink.href))
    || (explicitReviewPath && recordsByPath.get(explicitReviewPath))
    || recordsByName.get(normalizeName(row.name))

  if (!record) {
    const sourcePath = riskLink?.href || `${mainPermalink}${row.anchor?.startsWith('#') ? row.anchor : '#airport-shortlist'}`
    const sourceDocument = riskLink ? documentsByPath.get(riskLink.href) : mainArticle
    if (!sourceDocument) throw new Error(`Missing source document for ${row.name}: ${sourcePath}`)
    // Two distinct table-only airports can legitimately share a summary or notice URL.
    // Include the normalized name in that case rather than merging separate providers.
    record = makeRecord(sourceDocument, sourcePath, row.name, `${sourcePath}|${normalizeName(row.name)}`)
    recordsByPath.set(`main-only:${normalizeName(row.name)}`, record)
    recordsByName.set(normalizeName(row.name), record)
    mainOnlyCount += 1
  }

  if (row.priceDescription) record.priceDescription = row.priceDescription
  if (riskLink) {
    record.riskLabel = riskLink.label.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '').trim() || '风险提示'
    record.riskPath = riskLink.href
    record.riskTone = 'warning'
  }
}

// Explicit editorial states from the existing local notices, not automated verdicts.
// Keep recovered/history records distinct from ongoing warnings, and retain the source link.
const editorialStates = [
  {
    reviewPath: '/article/naiyun/',
    riskPath: '/scamvpn/naiyunyujing/',
    riskLabel: '风险提示',
    riskTone: 'warning',
    statusNote: '公告保留疑似跑路与持续观察提示。',
  },
  {
    reviewPath: '/article/yinyun/',
    riskPath: '/scamvpn/yinyunyujing/',
    riskLabel: '风险提示',
    riskTone: 'warning',
    statusNote: '公告保留关联运营风险与持续预警。',
  },
  {
    reviewPath: '/article/OKANC/',
    riskPath: '/scamvpn/OKANCyujing/',
    riskLabel: '风险提示',
    riskTone: 'warning',
    statusNote: '公告持续预警，未确认永久停运。',
  },
  {
    reviewPath: '/article/feimaoyun/',
    riskPath: '/scamvpn/feimaopaolu/',
    riskLabel: '恢复待复测',
    riskTone: 'info',
    statusNote: '入口恢复，节点、旧账户与客服待复测。',
  },
  {
    reviewPath: '/article/dengtacloud/',
    riskPath: '/scamvpn/dengtacloud-warning-2026/',
    riskLabel: '预警解除',
    riskTone: 'info',
    statusNote: '原预警已解除，保留历史中断与恢复记录。',
  },
]

for (const { reviewPath, statusNote, ...state } of editorialStates) {
  const record = recordsByPath.get(reviewPath)
  if (!record) continue
  if (!documentsByPath.has(state.riskPath)) throw new Error(`Missing editorial status notice: ${state.riskPath}`)
  Object.assign(record, state)
  record.note = `${statusNote}${defaultNote}`
}

const records = Array.from(recordsByPath.values()).sort((left, right) => stableCompare(left.sourcePath, right.sourcePath))
const output = [
  '// Generated by scripts/generate-airport-directory.mjs. Do not edit manually.',
  '// Monthly amounts stay unknown until separately reviewed; shortlist summaries retain their original billing terms.',
  `// Sources: ${reviewDocuments.length} detailed reviews and ${rows.length} main-article shortlist rows.`,
  "import type { AirportPlan } from './airportCatalog'",
  '',
  `export const airportDirectory: AirportPlan[] = ${JSON.stringify(records, null, 2)}`,
  '',
].join('\n')

if (process.argv.includes('--check')) {
  if (!existsSync(outputFile) || readFileSync(outputFile, 'utf8') !== output) {
    throw new Error('Airport directory is out of date. Run: node scripts/generate-airport-directory.mjs')
  }
}
else {
  mkdirSync(dirname(outputFile), { recursive: true })
  if (!existsSync(outputFile) || readFileSync(outputFile, 'utf8') !== output) writeFileSync(outputFile, output, 'utf8')
}

console.log(`Airport directory ${process.argv.includes('--check') ? 'verified' : 'generated'}: ${records.length} airports, ${reviewDocuments.length} detailed reviews, ${rows.length} shortlist rows, ${mainOnlyCount} main-only records, ${records.filter(record => record.riskPath).length} risk notices.`)
