import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const distDir = 'docs/.vuepress/dist'
const requiredFiles = ['sitemap.xml', 'robots.txt', 'feed.xml', 'llms.txt']
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

const sitemap = existsSync(join(distDir, 'sitemap.xml')) ? readFileSync(join(distDir, 'sitemap.xml'), 'utf8') : ''
const sitemapUrls = (sitemap.match(/<loc>/g) || []).length
if (sitemap && sitemapUrls < 50) {
  warnings.push(`sitemap.xml has only ${sitemapUrls} URLs`)
}

if (warnings.length) {
  console.warn(warnings.map(item => `WARN: ${item}`).join('\n'))
}

if (failures.length) {
  console.error(failures.map(item => `FAIL: ${item}`).join('\n'))
  process.exit(1)
}

console.log(`SEO check passed: ${htmlFiles.length} HTML files, ${sitemapUrls} sitemap URLs, ${feedItems} feed items.`)
