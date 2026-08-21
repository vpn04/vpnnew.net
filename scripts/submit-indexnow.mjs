import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const host = 'vpnnew.net'
const key = '9d8d8272f0d64b5e9c2ed4f33fb2f60b'
const keyLocation = `https://${host}/${key}.txt`
const endpoint = 'https://api.indexnow.org/indexnow'
const sitemapPath = resolve('docs/.vuepress/dist/sitemap.xml')

const readUrlsFromSitemap = () => {
  if (!existsSync(sitemapPath)) {
    throw new Error('Build the site first: pnpm docs:build')
  }

  const sitemap = readFileSync(sitemapPath, 'utf8')
  return [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map(match => match[1])
    .filter(url => url.startsWith(`https://${host}/`))
}

const chunks = (items, size) => {
  const result = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

const submit = async urls => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      host,
      key,
      keyLocation,
      urlList: urls,
    }),
  })

  if (!response.ok && response.status !== 202) {
    const text = await response.text()
    throw new Error(`IndexNow failed with ${response.status}: ${text}`)
  }

  return response.status
}

const urls = readUrlsFromSitemap()

if (urls.length === 0) {
  throw new Error('No URLs found in sitemap.xml')
}

for (const batch of chunks(urls, 1000)) {
  const status = await submit(batch)
  console.log(`Submitted ${batch.length} URLs to IndexNow, status: ${status}`)
}

