import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const distDir = 'docs/.vuepress/dist'
const siteUrl = 'https://vpnnew.net'
const requiredFiles = ['sitemap.xml', 'robots.txt', 'feed.xml', 'llms.txt']
const importantPaths = [
  '/',
  '/topics/',
  '/best-vpn-for-china/',
  '/vpn-airport-reviews/',
  '/clash/',
  '/shadowrocket/',
  '/vpn-speed-test/',
  '/vpn-recommend/',
  '/airport/jichangpk/',
  '/methodology/',
  '/disclosure/',
  '/contact/',
]
const collectionPagePaths = [
  '/topics/',
  '/best-vpn-for-china/',
  '/vpn-airport-reviews/',
  '/clash/',
  '/shadowrocket/',
  '/vpn-speed-test/',
]
const failures = []
const warnings = []

const collectHtmlFiles = directory => {
  const files = []
  for (const name of readdirSync(directory)) {
    const file = join(directory, name)
    const stat = statSync(file)
    if (stat.isDirectory()) files.push(...collectHtmlFiles(file))
    else if (name.endsWith('.html')) files.push(file)
  }
  return files
}

const mainContent = html => html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || ''

if (!existsSync(distDir)) {
  throw new Error('Build the site first: pnpm docs:build')
}

for (const file of requiredFiles) {
  if (!existsSync(join(distDir, file))) {
    failures.push(`Missing ${file}`)
  }
}

const htmlFiles = collectHtmlFiles(distDir)

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8')
  const relative = file.replace(/\\/g, '/').replace(`${distDir}/`, '')

  if (!/<title>[\s\S]+<\/title>/i.test(html)) failures.push(`${relative}: missing title`)
  if (!/<meta name="description" content="[^"]+"/i.test(html)) failures.push(`${relative}: missing description`)
  if (!/rel="canonical"/i.test(html)) failures.push(`${relative}: missing canonical`)
  if (!/application\/ld\+json/i.test(html)) failures.push(`${relative}: missing JSON-LD`)

  const body = mainContent(html)
  for (const tag of body.match(/<img\b[^>]*>/gi) || []) {
    const alt = tag.match(/\salt=(["'])(.*?)\1/i)?.[2]?.trim()
    if (!alt || alt.toLowerCase() === 'alt text') {
      failures.push(`${relative}: image with weak alt text`)
      break
    }
  }
}

const robots = existsSync(join(distDir, 'robots.txt')) ? readFileSync(join(distDir, 'robots.txt'), 'utf8') : ''
if (robots && !robots.includes('Sitemap: https://vpnnew.net/sitemap.xml')) {
  failures.push('robots.txt missing sitemap')
}

const feed = existsSync(join(distDir, 'feed.xml')) ? readFileSync(join(distDir, 'feed.xml'), 'utf8') : ''
const feedItems = (feed.match(/<item>/g) || []).length
if (feed && feedItems < 10) {
  warnings.push(`feed.xml has only ${feedItems} items`)
}

const llms = existsSync(join(distDir, 'llms.txt')) ? readFileSync(join(distDir, 'llms.txt'), 'utf8') : ''
if (llms && !importantPaths.slice(2, 7).every(path => llms.includes(`${siteUrl}${path}`))) {
  failures.push('llms.txt missing one or more core topic URLs')
}

const sitemap = existsSync(join(distDir, 'sitemap.xml')) ? readFileSync(join(distDir, 'sitemap.xml'), 'utf8') : ''
const sitemapUrls = (sitemap.match(/<loc>/g) || []).length
if (sitemap && sitemapUrls < 50) {
  warnings.push(`sitemap.xml has only ${sitemapUrls} URLs`)
}

for (const path of importantPaths) {
  const htmlPath = path === '/' ? join(distDir, 'index.html') : join(distDir, path.replace(/^\//, ''), 'index.html')
  if (!existsSync(htmlPath)) failures.push(`${path}: important landing page missing from build`)
  if (sitemap && !sitemap.includes(`<loc>${siteUrl}${path}</loc>`)) {
    failures.push(`${path}: important URL missing from sitemap`)
  }
}

for (const path of collectionPagePaths) {
  const htmlPath = path === '/' ? join(distDir, 'index.html') : join(distDir, path.replace(/^\//, ''), 'index.html')
  if (!existsSync(htmlPath)) continue

  const html = readFileSync(htmlPath, 'utf8')
  if (!html.includes('"@type":"CollectionPage"')) {
    failures.push(`${path}: missing CollectionPage structured data`)
  }
}

const sitemapImages = (sitemap.match(/<image:image>/g) || []).length
const sitemapLastmods = (sitemap.match(/<lastmod>/g) || []).length
if (sitemap && !sitemap.includes('xmlns:image=')) {
  failures.push('sitemap.xml missing image namespace')
}
if (sitemap && sitemapImages < 20) {
  failures.push(`sitemap.xml has only ${sitemapImages} image entries`)
}
if (sitemap && sitemapLastmods < 20) {
  warnings.push(`sitemap.xml has only ${sitemapLastmods} lastmod entries`)
}

if (warnings.length) {
  console.warn(warnings.map(item => `WARN: ${item}`).join('\n'))
}

if (failures.length) {
  console.error(failures.map(item => `FAIL: ${item}`).join('\n'))
  process.exit(1)
}

console.log(
  `SEO check passed: ${htmlFiles.length} HTML files, ${sitemapUrls} sitemap URLs, ${sitemapImages} sitemap images, ${feedItems} feed items.`,
)
