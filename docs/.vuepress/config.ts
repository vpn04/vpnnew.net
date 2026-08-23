/**
 * 查看以下文档了解主题配置
 * - @see https://theme-plume.vuejs.press/config/intro/ 配置说明
 * - @see https://theme-plume.vuejs.press/config/theme/ 主题配置项
 *
 * 请注意，对此文件的修改都会重启 vuepress 服务。
 * 部分配置项的更新没有必要重启 vuepress 服务，建议请在 `.vuepress/config.ts` 文件中配置
 *
 * 特别的，请不要在两个配置文件中重复配置相同的项，当前文件的配置项会被覆盖
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import type { App, PluginObject } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'
import { googleAnalyticsPlugin } from '@vuepress/plugin-google-analytics'

const siteUrl = 'https://vpnnew.net'
const siteLocale = 'zh-CN'
const siteAuthor = 'YouYou'
const siteTitle = 'YouYou VPN推荐与机场评测'
const siteDescription =
  '提供2026最新VPN推荐、翻墙机场评测、Clash与Shadowrocket教程，覆盖ChatGPT、Claude、Google等海外服务访问与节点优化。'
const englishSiteTitle = 'YouYou VPN Reviews and China Internet Access Guides'
const siteImage = `${siteUrl}/youyou.png`
const siteKeywords =
  'VPN推荐,翻墙机场,机场评测,Clash教程,Shadowrocket,科学上网,ChatGPT访问,Claude,Gemini'
const robotsDirective = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
const organizationId = `${siteUrl}/#organization`
const websiteId = `${siteUrl}/#website`
const authorId = `${siteUrl}/about/#youyou`

type TopicLink = {
  title: string
  url: string
  description: string
}

type HomeFaqItem = {
  question: string
  answer: string
}

const coreTopicLinks: TopicLink[] = [
  {
    title: '2026 中国可用 VPN 与机场推荐指南',
    url: `${siteUrl}/best-vpn-for-china/`,
    description: '面向中国大陆用户的核心选购入口，聚合 VPN 推荐、机场评测、设备教程、AI 工具访问和订阅风险检查。',
  },
  {
    title: 'VPN 机场评测中心',
    url: `${siteUrl}/vpn-airport-reviews/`,
    description: '聚合机场推荐榜、性能价格对比、近期机场深度评测、免费试用、优惠券和跑路预警。',
  },
  {
    title: 'AI 搜索与 AI Agent 稳定访问教程',
    url: `${siteUrl}/article/ai-search-agent-access-guide-2026/`,
    description: '围绕 ChatGPT Search、Google AI Mode、Claude、Gemini 等热门 AI 工具，整理官方入口、地区限制、客户端、DNS 和节点稳定性排查。',
  },
  {
    title: 'Clash 教程专题',
    url: `${siteUrl}/clash/`,
    description: '集中整理 Clash 全平台安装、Clash Verge、Android、TUN 模式、订阅导入和常见故障排查。',
  },
  {
    title: 'Shadowrocket 小火箭专题',
    url: `${siteUrl}/shadowrocket/`,
    description: '面向 iPhone 和 iPad 用户的 Shadowrocket 下载、节点订阅、配置失效、DNS 和节点超时排查入口。',
  },
  {
    title: 'VPN 速度与稳定性测试专题',
    url: `${siteUrl}/vpn-speed-test/`,
    description: '整理 VPN 和机场测速、晚高峰观察、节点优化、DNS 泄露、丢包延迟与客户端排查方法。',
  },
  {
    title: '2026 年性价比翻墙机场推荐评测',
    url: `${siteUrl}/vpn-recommend/`,
    description: '长期更新的 VPN 机场推荐榜，覆盖价格、速度、稳定性、流媒体解锁和适用人群。',
  },
  {
    title: '机场性能与价格对比榜',
    url: `${siteUrl}/airport/jichangpk/`,
    description: '按价格、线路、套餐、晚高峰表现和节点质量对多个机场做横向对比。',
  },
  {
    title: 'Clash 全平台使用教程',
    url: `${siteUrl}/scamvpn/Clashquanpingtai/`,
    description: '覆盖 Windows、macOS、Android、iOS 的 Clash 客户端安装、导入订阅和常见故障。',
  },
  {
    title: 'Shadowrocket 小火箭教程',
    url: `${siteUrl}/article/Shadowrocket/`,
    description: '面向 iOS 和 macOS 用户的 Shadowrocket 下载、配置、订阅导入和排查指南。',
  },
  {
    title: '机场跑路汇总与风险预警',
    url: `${siteUrl}/scamvpn/paolujichang/`,
    description: '整理机场跑路事件、失联风险、退款风险和订阅前需要警惕的异常信号。',
  },
  {
    title: 'YouYou 评测方法与评分标准',
    url: `${siteUrl}/methodology/`,
    description: '公开说明本站如何评测 VPN 与机场服务，包括测速、稳定性、售后和风险判断。',
  },
]

const homeFaqItems: HomeFaqItem[] = [
  {
    question: 'VPN 和机场有什么区别？',
    answer: 'VPN 更像成品服务，机场更偏节点订阅和客户端组合。新手优先看稳定性、售后和客户端支持，进阶用户再比较线路、协议和规则分流。',
  },
  {
    question: '2026 年选机场先看什么？',
    answer: '先看最近测试日期、晚高峰速度、退款规则、套餐周期和跑路风险。不要只看低价大流量，长期年付前最好先短期试用。',
  },
  {
    question: 'Shadowrocket 节点哪里买？',
    answer: '建议从长期更新、支持通用订阅、售后渠道清楚的机场里选，再用小火箭导入订阅测试延迟、丢包和常用网站可用性。',
  },
  {
    question: 'Clash 连接成功但打不开 Google 怎么办？',
    answer: '常见原因是 DNS、规则分流、系统代理、浏览器缓存或节点本身不可用。先切换节点，再检查规则模式和 DNS 设置。',
  },
  {
    question: 'ChatGPT、Claude、Gemini 无法使用怎么办？',
    answer: '优先检查节点地区、IP 质量、浏览器环境和账号风控。AI 工具访问通常比普通网页更挑节点，建议准备备用线路。',
  },
  {
    question: '免费 VPN 或免费节点可以长期用吗？',
    answer: '不建议长期依赖。免费节点通常速度、稳定性和隐私都不可控，更适合临时测试；重要账号和长期使用应选择可验证的服务。',
  },
  {
    question: '怎么判断机场可能要跑路？',
    answer: '长期失联、官网频繁打不开、节点大面积超时、套餐突然异常低价、客服停止响应和数据丢失，都是需要警惕的信号。',
  },
  {
    question: '本站推荐依据是什么？',
    answer: '本站会结合套餐价格、节点质量、晚高峰表现、流媒体和 AI 工具解锁、客户端兼容、售后与风险记录做综合判断。',
  },
]

const topicLandingPaths = new Set([
  '/best-vpn-for-china/',
  '/vpn-airport-reviews/',
  '/clash/',
  '/shadowrocket/',
  '/vpn-speed-test/',
])

const generatedSeoPages = [
  {
    path: '/blog/',
    title: 'YouYou VPN博客｜科学上网教程与机场评测合集',
    description:
      '按发布时间汇总 YouYou 的 VPN 推荐、机场评测、Clash 与 Shadowrocket 教程、AI 工具访问和科学上网避坑文章。',
  },
  {
    path: '/blog/tags/',
    title: 'VPN教程标签索引｜YouYou',
    description:
      '按标签浏览 VPN推荐、机场评测、Clash、Shadowrocket、Telegram、AI工具访问等主题内容。',
  },
  {
    path: '/blog/categories/',
    title: 'VPN与科学上网文章分类｜YouYou',
    description:
      '按分类浏览 YouYou 的科学上网教程、机场深度评测、跑路预警、优惠试用、Telegram 和 AI 工具访问指南。',
  },
  {
    path: '/blog/archives/',
    title: 'YouYou文章归档｜VPN评测与科学上网教程',
    description:
      '按时间归档 YouYou 长期更新的 VPN 推荐、机场评测、Clash/Shadowrocket 教程与科学上网问题解答。',
  },
]

const getHeadContent = (
  head: readonly unknown[],
  attribute: 'name' | 'property',
  key: string,
): string | undefined => {
  const entry = head.find(item => {
    if (!Array.isArray(item) || item[0] !== 'meta') return false
    const attrs = item[1]
    return typeof attrs === 'object' && attrs !== null && (attrs as Record<string, string>)[attribute] === key
  })
  const attrs = Array.isArray(entry) ? entry[1] : undefined
  return typeof attrs === 'object' && attrs !== null ? (attrs as Record<string, string>).content : undefined
}

const appendMetaIfMissing = (head: unknown[], name: string, content: string): void => {
  if (!getHeadContent(head, 'name', name)) {
    head.push(['meta', { name, content }])
  }
}

const appendPropertyMetaIfMissing = (head: unknown[], property: string, content: string): void => {
  if (!getHeadContent(head, 'property', property)) {
    head.push(['meta', { property, content }])
  }
}

const getDedupeHeadKey = (item: unknown): string | undefined => {
  if (!Array.isArray(item)) return undefined
  const [tag, attrs] = item
  if (typeof attrs !== 'object' || attrs === null) return undefined
  const record = attrs as Record<string, string>

  if (tag === 'meta') {
    const property = record.property
    const name = record.name
    if (property === 'article:tag' || property === 'og:locale:alternate') return undefined
    if (property) return `meta:property:${property}`
    if (name) return `meta:name:${name}`
  }

  if (tag === 'link') {
    if (record.rel === 'canonical') return 'link:canonical'
    if (record.rel === 'sitemap') return 'link:sitemap'
    if (record.rel === 'alternate' && record.hreflang) return `link:alternate:${record.hreflang}`
  }

  return undefined
}

const dedupeSeoHead = (head: unknown[]): void => {
  const seen = new Set<string>()
  for (let index = 0; index < head.length; index += 1) {
    const key = getDedupeHeadKey(head[index])
    if (!key) continue
    if (seen.has(key)) {
      head.splice(index, 1)
      index -= 1
    }
    else {
      seen.add(key)
    }
  }
}

const appendTwitterCardHead = (head: unknown[], page: { title?: string, path: string, frontmatter: Record<string, unknown> }): void => {
  const title = getHeadContent(head, 'property', 'og:title') || page.title || siteTitle
  const description =
    getHeadContent(head, 'property', 'og:description') ||
    (typeof page.frontmatter.description === 'string' ? page.frontmatter.description : siteDescription)
  const image = getHeadContent(head, 'property', 'og:image') || siteImage

  appendMetaIfMissing(head, 'twitter:card', 'summary_large_image')
  appendMetaIfMissing(head, 'twitter:site', '@youyouvpn')
  appendMetaIfMissing(head, 'twitter:creator', '@youyouvpn')
  appendMetaIfMissing(head, 'twitter:title', title)
  appendMetaIfMissing(head, 'twitter:description', description)
  appendMetaIfMissing(head, 'twitter:image', image)
  appendMetaIfMissing(head, 'twitter:image:alt', title)
}

const appendArticleMetaHead = (
  head: unknown[],
  page: { title?: string, path: string, filePathRelative?: string | null, frontmatter: Record<string, unknown> },
): void => {
  const title = getHeadContent(head, 'property', 'og:title') || page.title || siteTitle
  const published = toIsoDate(page.frontmatter.date || page.frontmatter.createTime)
  const modified = toIsoDate(page.frontmatter.updated || page.frontmatter.lastUpdated || page.frontmatter.date || page.frontmatter.createTime)
  const tags = getFrontmatterStringList(page.frontmatter, 'tags')

  appendPropertyMetaIfMissing(head, 'og:image:alt', title)

  if (!isArticlePage(page)) return

  if (published) appendPropertyMetaIfMissing(head, 'article:published_time', published)
  if (modified) appendPropertyMetaIfMissing(head, 'article:modified_time', modified)
  appendPropertyMetaIfMissing(head, 'article:author', `${siteUrl}/about/`)

  if (tags[0]) {
    appendPropertyMetaIfMissing(head, 'article:section', tags[0])
  }
}

const getPageUrl = (page: { path: string }): string => `${siteUrl}${page.path}`

const getFrontmatterString = (frontmatter: Record<string, unknown>, key: string): string | undefined => {
  const value = frontmatter[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

const getFrontmatterStringList = (frontmatter: Record<string, unknown>, key: string): string[] => {
  const value = frontmatter[key]
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map(item => item.trim()).filter(Boolean)
  }
  return []
}

const toIsoDate = (value: unknown): string | undefined => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  if (typeof value !== 'string' || !value.trim()) return undefined

  const normalized = value.trim().replace(/\//g, '-')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const getPageDescription = (
  head: readonly unknown[],
  page: { frontmatter: Record<string, unknown> },
): string =>
  getHeadContent(head, 'property', 'og:description') ||
  getHeadContent(head, 'name', 'description') ||
  getFrontmatterString(page.frontmatter, 'description') ||
  siteDescription

const getPageImage = (head: readonly unknown[], page: { frontmatter: Record<string, unknown> }): string =>
  getHeadContent(head, 'property', 'og:image') ||
  getFrontmatterString(page.frontmatter, 'cover') ||
  getFrontmatterString(page.frontmatter, 'image') ||
  siteImage

const hasJsonLdType = (head: readonly unknown[], type: string): boolean =>
  head.some(item => {
    if (!Array.isArray(item) || item[0] !== 'script') return false
    const attrs = item[1]
    const content = item[2]
    if (typeof attrs !== 'object' || attrs === null) return false
    if ((attrs as Record<string, string>).type !== 'application/ld+json') return false
    return typeof content === 'string' && new RegExp(`"@type"\\s*:\\s*"${type}"`).test(content)
  })

const appendJsonLd = (head: unknown[], data: Record<string, unknown> | Record<string, unknown>[]): void => {
  head.push(['script', { type: 'application/ld+json' }, JSON.stringify(data)])
}

const createOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': organizationId,
  name: 'YouYou',
  url: `${siteUrl}/`,
  logo: {
    '@type': 'ImageObject',
    url: siteImage,
  },
  sameAs: ['https://t.me/youyouvpn', 'https://github.com/vpn04/vpnnew.net'],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'yyo649929@gmail.com',
    contactType: 'customer support',
    availableLanguage: ['zh-CN', 'en'],
  },
})

const createWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': websiteId,
  name: siteTitle,
  alternateName: englishSiteTitle,
  url: `${siteUrl}/`,
  description: siteDescription,
  inLanguage: siteLocale,
  publisher: {
    '@id': organizationId,
  },
})

const createCoreTopicItemListSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'YouYou VPN 与科学上网核心专题',
  description: 'YouYou 站内最重要的 VPN 推荐、机场评测、Clash、Shadowrocket、跑路预警和评测方法入口。',
  itemListElement: coreTopicLinks.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'WebPage',
      name: item.title,
      url: item.url,
      description: item.description,
    },
  })),
})

const createHomeFaqSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: homeFaqItems.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
})

const createTopicsCollectionSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'VPN 与科学上网专题索引',
  url: `${siteUrl}/topics/`,
  description: '聚合 YouYou 站内 VPN 推荐、机场评测、Clash 教程、Shadowrocket 教程、优惠试用、跑路预警和 AI 工具访问指南。',
  inLanguage: siteLocale,
  isPartOf: {
    '@id': websiteId,
  },
  publisher: {
    '@id': organizationId,
  },
  mainEntity: createCoreTopicItemListSchema(),
})

const createTopicLandingCollectionSchema = (
  head: readonly unknown[],
  page: { title?: string, path: string, frontmatter: Record<string, unknown> },
): Record<string, unknown> => {
  const tags = getFrontmatterStringList(page.frontmatter, 'tags')

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.title || siteTitle,
    url: getPageUrl(page),
    description: getPageDescription(head, page),
    inLanguage: siteLocale,
    isPartOf: {
      '@id': websiteId,
    },
    publisher: {
      '@id': organizationId,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: getPageImage(head, page),
    },
    about: tags.slice(0, 8).map(name => ({
      '@type': 'Thing',
      name,
    })),
  }
}

const isArticlePage = (page: { path: string, filePathRelative?: string | null, frontmatter: Record<string, unknown> }): boolean => {
  const relative = page.filePathRelative?.replace(/\\/g, '/') || ''
  return Boolean(relative.startsWith('blog/') && page.path !== '/' && !page.frontmatter.home)
}

const createBreadcrumbSchema = (page: { title?: string, path: string }): Record<string, unknown> => {
  const isArticle = page.path.startsWith('/article/') ||
    page.path.startsWith('/vpn/') ||
    page.path.startsWith('/scamvpn/') ||
    page.path.startsWith('/airport/')
  const items = [
    { name: '首页', url: `${siteUrl}/` },
    ...(isArticle ? [{ name: '博客', url: `${siteUrl}/blog/` }] : []),
    { name: page.title || siteTitle, url: getPageUrl(page) },
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

const createArticleSchema = (
  head: readonly unknown[],
  page: { title?: string, path: string, frontmatter: Record<string, unknown> },
): Record<string, unknown> => {
  const title = getHeadContent(head, 'property', 'og:title') || page.title || siteTitle
  const published = toIsoDate(page.frontmatter.date || page.frontmatter.createTime)
  const modified = toIsoDate(page.frontmatter.updated || page.frontmatter.lastUpdated || page.frontmatter.date || page.frontmatter.createTime)
  const tags = getFrontmatterStringList(page.frontmatter, 'tags')

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    url: getPageUrl(page),
    description: getPageDescription(head, page),
    image: [getPageImage(head, page)],
    datePublished: published,
    dateModified: modified,
    isAccessibleForFree: true,
    articleSection: tags[0] || 'VPN 与科学上网',
    about: tags.slice(0, 8).map(name => ({
      '@type': 'Thing',
      name,
    })),
    author: {
      '@type': 'Person',
      '@id': authorId,
      name: siteAuthor,
      url: `${siteUrl}/about/`,
    },
    publisher: {
      '@id': organizationId,
    },
    mainEntityOfPage: getPageUrl(page),
    inLanguage: siteLocale,
    keywords: tags.length ? tags.join(',') : siteKeywords,
  }
}

const appendAlternateLanguageHead = (head: unknown[], page: { path: string }): void => {
  if (page.path !== '/' && page.path !== '/en/') return

  head.push(['link', { rel: 'alternate', hreflang: 'zh-CN', href: `${siteUrl}/` }])
  head.push(['link', { rel: 'alternate', hreflang: 'en', href: `${siteUrl}/en/` }])
  head.push(['link', { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}/` }])
}

const appendPageStructuredData = (
  head: unknown[],
  page: { title?: string, path: string, filePathRelative?: string | null, frontmatter: Record<string, unknown> },
): void => {
  const schemas: Record<string, unknown>[] = []

  if (!hasJsonLdType(head, 'Organization')) schemas.push(createOrganizationSchema())
  if (!hasJsonLdType(head, 'WebSite')) schemas.push(createWebsiteSchema())
  if (!hasJsonLdType(head, 'BreadcrumbList')) schemas.push(createBreadcrumbSchema(page))
  if ((page.path === '/' || page.path === '/topics/') && !hasJsonLdType(head, 'ItemList')) {
    schemas.push(createCoreTopicItemListSchema())
  }
  if (page.path === '/' && !hasJsonLdType(head, 'FAQPage')) {
    schemas.push(createHomeFaqSchema())
  }

  if (isArticlePage(page) && !hasJsonLdType(head, 'Article')) {
    schemas.push(createArticleSchema(head, page))
  }
  else if (topicLandingPaths.has(page.path) && !hasJsonLdType(head, 'CollectionPage')) {
    schemas.push(createTopicLandingCollectionSchema(head, page))
  }
  else if (page.path === '/contact/' && !hasJsonLdType(head, 'ContactPage')) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: page.title || '联系与纠错',
      url: getPageUrl(page),
      description: getPageDescription(head, page),
      publisher: {
        '@id': organizationId,
      },
    })
  }
  else if (page.path === '/about/' && !hasJsonLdType(head, 'AboutPage')) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: page.title || '关于 YouYou',
      url: getPageUrl(page),
      description: getPageDescription(head, page),
      publisher: {
        '@id': organizationId,
      },
    })
  }
  else if (page.path === '/topics/' && !hasJsonLdType(head, 'CollectionPage')) {
    schemas.push(createTopicsCollectionSchema())
  }

  if (schemas.length) appendJsonLd(head, schemas)
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const createGeneratedPageSeoHead = (page: typeof generatedSeoPages[number]): string => {
  const url = `${siteUrl}${page.path}`
  const title = escapeHtml(page.title)
  const description = escapeHtml(page.description)
  const image = escapeHtml(siteImage)

  return [
    `<link rel="canonical" href="${url}">`,
    `<meta name="description" content="${description}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:site_name" content="${escapeHtml(siteTitle)}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:alt" content="${title}">`,
    `<meta property="og:locale" content="${siteLocale}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:site" content="@youyouvpn">',
    '<meta name="twitter:creator" content="@youyouvpn">',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${image}">`,
    `<meta name="twitter:image:alt" content="${title}">`,
    `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: page.title,
      url,
      description: page.description,
      inLanguage: siteLocale,
      isPartOf: {
        '@id': websiteId,
      },
      publisher: {
        '@id': organizationId,
      },
    })}</script>`,
  ].join('')
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')

const stripHtml = (value: string): string =>
  value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const getPageDateValue = (page: App['pages'][number]): number => {
  const value = toIsoDate(page.frontmatter.updated || page.frontmatter.lastUpdated || page.frontmatter.date || page.frontmatter.createTime)
  return value ? new Date(value).getTime() : 0
}

const getArticlePages = (app: App): App['pages'] =>
  app.pages
    .filter(page => isArticlePage(page))
    .sort((left, right) => getPageDateValue(right) - getPageDateValue(left))

const getAbsolutePageUrl = (page: { path: string }): string => `${siteUrl}${page.path}`

const writeFeedFile = (app: App): void => {
  const articles = getArticlePages(app).slice(0, 80)
  const items = articles.map(page => {
    const title = escapeXml(page.title || siteTitle)
    const url = escapeXml(getAbsolutePageUrl(page))
    const description = escapeXml(getFrontmatterString(page.frontmatter, 'description') || siteDescription)
    const pubDateValue = getPageDateValue(page)
    const pubDate = pubDateValue ? new Date(pubDateValue).toUTCString() : new Date().toUTCString()

    return [
      '<item>',
      `<title>${title}</title>`,
      `<link>${url}</link>`,
      `<guid isPermaLink="true">${url}</guid>`,
      `<description>${description}</description>`,
      `<pubDate>${pubDate}</pubDate>`,
      '</item>',
    ].join('')
  })

  const feed = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '<channel>',
    `<title>${escapeXml(siteTitle)}</title>`,
    `<link>${siteUrl}/</link>`,
    `<description>${escapeXml(siteDescription)}</description>`,
    '<language>zh-CN</language>',
    `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    ...items,
    '</channel>',
    '</rss>',
  ].join('\n')

  writeFileSync(app.dir.dest('feed.xml'), feed, 'utf8')
}

const writeLlmsTextFile = (app: App): void => {
  const recentArticles = getArticlePages(app).slice(0, 24)
  const topicLines = coreTopicLinks.map(item => `- [${item.title}](${item.url}): ${item.description}`)
  const recentLines = recentArticles.map(page => {
    const description = getFrontmatterString(page.frontmatter, 'description') || siteDescription
    return `- [${page.title || siteTitle}](${getAbsolutePageUrl(page)}): ${description}`
  })

  const content = [
    '# YouYou VPN 推荐与机场评测',
    '',
    '> YouYou 是一个长期更新 VPN 推荐、机场评测、Clash / Shadowrocket 教程、AI 工具访问、跑路预警和科学上网排查指南的网站。',
    '',
    '## Site',
    '',
    `- URL: ${siteUrl}/`,
    `- Language: ${siteLocale}`,
    '- Author: YouYou',
    '- Contact: yyo649929@gmail.com',
    '',
    '## Core Topics',
    '',
    ...topicLines,
    '',
    '## Trust And Methodology',
    '',
    `- [评测方法](${siteUrl}/methodology/): 说明测速、晚高峰、流媒体、AI 工具访问、售后和风险判断标准。`,
    `- [广告披露](${siteUrl}/disclosure/): 说明联盟链接、优惠码和评测独立性。`,
    `- [联系与纠错](${siteUrl}/contact/): 提交价格变化、链接失效、机场异常、跑路风险和内容纠错。`,
    '',
    '## Recent Articles',
    '',
    ...recentLines,
    '',
  ].join('\n')

  writeFileSync(app.dir.dest('llms.txt'), content, 'utf8')
}

const writeEnhancedRobotsFile = (app: App): void => {
  const content = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    `Host: ${siteUrl.replace(/^https?:\/\//, '')}`,
    '',
    '# Content signals for crawlers that understand them.',
    'Content-Signal: search=yes,ai-train=no,use=reference',
    '',
  ].join('\n')

  writeFileSync(app.dir.dest('robots.txt'), content, 'utf8')
}

const collectHtmlFiles = (directory: string): string[] => {
  const files: string[] = []
  for (const name of readdirSync(directory)) {
    const file = `${directory}/${name}`
    const stat = statSync(file)
    if (stat.isDirectory()) files.push(...collectHtmlFiles(file))
    else if (name.endsWith('.html')) files.push(file)
  }
  return files
}

const getHtmlTitle = (html: string): string => {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  const title = h1 || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || siteTitle
  return stripHtml(title).replace(/\s+\|\s+.*$/, '').trim() || siteTitle
}

const enhanceMainContentImages = (html: string): string => {
  const mainMatch = html.match(/<main\b[\s\S]*?<\/main>/i)
  if (!mainMatch) return html

  const pageTitle = escapeHtml(getHtmlTitle(html))
  const enhancedMain = mainMatch[0].replace(/<img\b[^>]*>/gi, tag => {
    let nextTag = tag
    const altMatch = nextTag.match(/\salt=(["'])(.*?)\1/i)
    const hasUsefulAlt = altMatch && altMatch[2].trim() && altMatch[2].trim().toLowerCase() !== 'alt text'

    if (!hasUsefulAlt) {
      if (altMatch) {
        nextTag = nextTag.replace(/\salt=(["'])(.*?)\1/i, ` alt="${pageTitle} 相关截图"`)
      }
      else {
        nextTag = nextTag.replace(/<img\b/i, `<img alt="${pageTitle} 相关截图"`)
      }
    }

    if (!/\sloading=/i.test(nextTag)) {
      nextTag = nextTag.replace(/<img\b/i, '<img loading="lazy"')
    }

    if (!/\sdecoding=/i.test(nextTag)) {
      nextTag = nextTag.replace(/<img\b/i, '<img decoding="async"')
    }

    return nextTag
  })

  return html.replace(mainMatch[0], enhancedMain)
}

const enhanceGeneratedHtml = (app: App): void => {
  for (const file of collectHtmlFiles(app.dir.dest())) {
    const html = readFileSync(file, 'utf8')
    const enhanced = enhanceMainContentImages(html)
    if (enhanced !== html) {
      writeFileSync(file, enhanced, 'utf8')
    }
  }
}

const unescapeXml = (value: string): string =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

const getHtmlAttribute = (tag: string, attribute: string): string | undefined =>
  tag.match(new RegExp(`\\s${attribute}=(["'])(.*?)\\1`, 'i'))?.[2]

const toAbsoluteAssetUrl = (url: string, pagePath: string): string | undefined => {
  const cleanUrl = unescapeXml(url).trim()
  if (!cleanUrl || cleanUrl.startsWith('data:')) return undefined

  try {
    return new URL(cleanUrl, `${siteUrl}${pagePath}`).toString()
  }
  catch {
    return undefined
  }
}

const getGeneratedHtmlFile = (app: App, pagePath: string): string =>
  app.dir.dest(pagePath === '/' ? 'index.html' : `${pagePath.replace(/^\//, '')}index.html`)

const getFirstPageImageUrl = (html: string, pagePath: string): string | undefined => {
  const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html

  for (const tag of mainHtml.match(/<img\b[^>]*>/gi) || []) {
    const src = getHtmlAttribute(tag, 'src')
    const imageUrl = src ? toAbsoluteAssetUrl(src, pagePath) : undefined
    if (imageUrl) return imageUrl
  }

  const ogImage = html.match(/<meta\s+property=(["'])og:image\1\s+content=(["'])(.*?)\2/i)?.[3] ||
    html.match(/<meta\s+content=(["'])(.*?)\1\s+property=(["'])og:image\3/i)?.[2]
  return ogImage ? toAbsoluteAssetUrl(ogImage, pagePath) : siteImage
}

const getSitemapLastmod = (page: App['pages'][number]): string | undefined => {
  const value = getPageDateValue(page)
  return value ? new Date(value).toISOString().slice(0, 10) : undefined
}

const getSitemapPage = (
  pageByPath: Map<string, App['pages'][number]>,
  loc: string,
): App['pages'][number] | undefined => {
  try {
    const path = new URL(unescapeXml(loc)).pathname
    return pageByPath.get(path) || pageByPath.get(decodeURI(path)) || pageByPath.get(encodeURI(path))
  }
  catch {
    return undefined
  }
}

const enhanceSitemapFile = (app: App): void => {
  const sitemapFile = app.dir.dest('sitemap.xml')
  if (!existsSync(sitemapFile)) return

  const pageByPath = new Map<string, App['pages'][number]>()
  for (const page of app.pages) {
    pageByPath.set(page.path, page)
    pageByPath.set(encodeURI(page.path), page)
  }

  let sitemap = readFileSync(sitemapFile, 'utf8')
  if (!sitemap.includes('xmlns:image=')) {
    sitemap = sitemap.replace(
      /<urlset\b([^>]*)>/,
      '<urlset$1 xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    )
  }

  sitemap = sitemap.replace(/<url>[\s\S]*?<\/url>/g, urlBlock => {
    const loc = urlBlock.match(/<loc>([\s\S]*?)<\/loc>/i)?.[1]
    if (!loc) return urlBlock

    const page = getSitemapPage(pageByPath, loc)
    if (!page) return urlBlock

    let nextBlock = urlBlock
    const lastmod = getSitemapLastmod(page)
    if (lastmod && !/<lastmod>/i.test(nextBlock)) {
      nextBlock = nextBlock.replace(/(<loc>[\s\S]*?<\/loc>)/i, `$1\n    <lastmod>${lastmod}</lastmod>`)
    }

    if (!/<image:image>/i.test(nextBlock)) {
      const htmlFile = getGeneratedHtmlFile(app, page.path)
      const html = existsSync(htmlFile) ? readFileSync(htmlFile, 'utf8') : ''
      const imageUrl = getFirstPageImageUrl(html, page.path)
      if (imageUrl) {
        nextBlock = nextBlock.replace(
          '</url>',
          `\n    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n    </image:image>\n  </url>`,
        )
      }
    }

    return nextBlock
  })

  writeFileSync(sitemapFile, sitemap, 'utf8')
}

const generatedPageSeoPlugin = (): PluginObject => ({
  name: 'youyou-generated-page-seo',
  onGenerated: (app: App) => {
    for (const page of generatedSeoPages) {
      const file = app.dir.dest(`${page.path.replace(/^\//, '')}index.html`)
      if (!existsSync(file)) continue

      let html = readFileSync(file, 'utf8')
      if (html.includes('rel="canonical"')) continue

      html = html.replace(
        /<title>[\s\S]*?<\/title>/,
        `<title>${escapeHtml(page.title)} | ${escapeHtml(siteTitle)}</title>`,
      )
      html = html.replace(/<meta name="description" content="[^"]*">/g, '')
      html = html.replace('<head>', `<head>${createGeneratedPageSeoHead(page)}`)
      writeFileSync(file, html, 'utf8')
    }

    const englishHomeFile = app.dir.dest('en/index.html')
    if (existsSync(englishHomeFile)) {
      const html = readFileSync(englishHomeFile, 'utf8')
        .replace('<html lang="zh-CN">', '<html lang="en-US">')
        .replace('<meta property="og:locale" content="zh-CN">', '<meta property="og:locale" content="en-US">')
      writeFileSync(englishHomeFile, html, 'utf8')
    }

    writeFeedFile(app)
    writeLlmsTextFile(app)
    writeEnhancedRobotsFile(app)
    enhanceGeneratedHtml(app)
    enhanceSitemapFile(app)
  },
})

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: siteTitle,
  description: siteDescription,
  plugins: [
    googleAnalyticsPlugin({
      id: 'G-ZH70TFW573',
    }),
    generatedPageSeoPlugin(),
  ],

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', href: '/youyou.png' }],
    ['link', { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' }],
    ['link', { rel: 'alternate', type: 'application/rss+xml', title: `${siteTitle} RSS`, href: '/feed.xml' }],
    ['link', { rel: 'alternate', type: 'text/plain', title: 'llms.txt', href: '/llms.txt' }],
    ['link', { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' }],
    ['link', { rel: 'preconnect', href: 'https://www.googletagmanager.com' }],
    ['link', { rel: 'dns-prefetch', href: 'https://giscus.app' }],
    ['link', { rel: 'preconnect', href: 'https://giscus.app' }],

    ['meta', { name: 'keywords', content: siteKeywords }],
    ['meta', { name: 'author', content: 'YouYou' }],
    ['meta', { name: 'application-name', content: siteTitle }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'YouYou VPN' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    ['meta', { name: 'robots', content: robotsDirective }],
    ['meta', { name: 'googlebot', content: robotsDirective }],
    ['meta', { name: 'bingbot', content: robotsDirective }],
    ['meta', { name: 'format-detection', content: 'telephone=no' }],
    ['meta', { name: 'theme-color', content: '#2563eb' }],
  ],

  bundler: viteBundler({
    viteOptions: {
      build: {
        target: 'es2020',
      },
    },
  }),
  shouldPrefetch: false, // 站点较大，页面数量较多时，不建议启用
  shouldPreload: false,

  theme: plumeTheme({
    home: '/',
    /* 添加您的部署域名, 有助于 SEO, 生成 sitemap */
    hostname: siteUrl,
    plugins: {
      seo: {
        canonical: page => `${siteUrl}${page.path}`,
        fallBackImage: siteImage,
        twitterID: '@youyouvpn',
        author: {
          name: siteAuthor,
          url: `${siteUrl}/`,
          email: 'yyo649929@gmail.com',
        },
        isArticle: page => isArticlePage(page),
        customHead: (head, page) => {
          appendTwitterCardHead(head, page)
          appendArticleMetaHead(head, page)
          appendAlternateLanguageHead(head, page)
          appendPageStructuredData(head, page)
          dedupeSeoHead(head)
        },
      },
    },
    footer: {
      message: "© 2026 YouYou | VPN评测与科学上网指南 | <a href='/topics/'>专题</a> · <a href='/about/'>关于</a> · <a href='/methodology/'>评测方法</a> · <a href='/disclosure/'>披露</a> · <a href='/contact/'>联系</a>",
    },

    /* 文档仓库配置，用于 editLink */
    // docsRepo: '',
    // docsDir: 'docs',
    // docsBranch: '',

    /* 页内信息 */
    // editLink: true,
    // lastUpdated: true,
    // contributors: true,
    // changelog: false,

    /**
     * 博客
     * @see https://theme-plume.vuejs.press/config/basic/#blog
     */
    // blog: false, // 禁用博客
    blog: {
      postList: true, // 是否启用文章列表页
      tags: true, // 是否启用标签页
      archives: true, // 是否启用归档页
      categories: true, // 是否启用分类页
      postCover: 'right', // 文章封面位置
      pagination: 12, // 每页显示文章数量
    },

    /* 博客文章页面链接前缀 */
    article: '/article/',

    /**
     * 编译缓存，加快编译速度
     * @see https://theme-plume.vuejs.press/config/basic/#cache
     */
    cache: 'filesystem',

    /**
     * 为 markdown 文件自动添加 frontmatter 配置
     * @see https://theme-plume.vuejs.press/config/basic/#autofrontmatter
     */
    // autoFrontmatter: {
    //   permalink: true,  // 是否生成永久链接
    //   createTime: true, // 是否生成创建时间
    //   title: true,      // 是否生成标题
    // },

    /* 本地搜索, 默认启用 */
    search: { provider: 'local' },

    /**
     * Algolia DocSearch
     * 启用此搜索需要将 本地搜索 search 设置为 false
     * @see https://theme-plume.vuejs.press/config/plugins/search/#algolia-docsearch
     */
    // search: {
    //   provider: 'algolia',
    //   appId: '',
    //   apiKey: '',
    //   indexName: '',
    // },

    /**
     * Shiki 代码高亮
     * @see https://theme-plume.vuejs.press/config/plugins/code-highlight/
     */
    // codeHighlighter: {
    //   twoslash: true, // 启用 twoslash
    //   whitespace: true, // 启用 空格/Tab 高亮
    //   lineNumbers: true, // 启用行号
    // },

    /* 文章字数统计、阅读时间，设置为 false 则禁用 */
    // readingTime: true,

    /**
      * markdown
      * @see https://theme-plume.vuejs.press/config/markdown/
      */
    markdown: {
      collapse: true,  // 折叠面板
      imageSize: 'local', // 自动补充本地图片宽高，减少页面布局抖动
    //   abbr: true,         // 启用 abbr 语法  *[label]: content
    //   annotation: true,   // 启用 annotation 语法  [+label]: content
    //   pdf: true,          // 启用 PDF 嵌入 @[pdf](/xxx.pdf)
    //   caniuse: true,      // 启用 caniuse 语法  @[caniuse](feature_name)
    //   plot: true,         // 启用隐秘文本语法 !!xxxx!!
    //   bilibili: true,     // 启用嵌入 bilibili视频 语法 @[bilibili](bid)
    //   youtube: true,      // 启用嵌入 youtube视频 语法 @[youtube](video_id)
    //   artPlayer: true,    // 启用嵌入 artPlayer 本地视频 语法 @[artPlayer](url)
    //   audioReader: true,  // 启用嵌入音频朗读功能 语法 @[audioReader](url)
    //   icon: { provider: 'iconify' },        // 启用内置图标语法  ::icon-name::
    //   table: true,        // 启用表格增强容器语法 ::: table
    //   codepen: true,      // 启用嵌入 codepen 语法 @[codepen](user/slash)
    //   replit: true,       // 启用嵌入 replit 语法 @[replit](user/repl-name)
    //   codeSandbox: true,  // 启用嵌入 codeSandbox 语法 @[codeSandbox](id)
    //   jsfiddle: true,     // 启用嵌入 jsfiddle 语法 @[jsfiddle](user/id)
    //   npmTo: true,        // 启用 npm-to 容器  ::: npm-to
    //   demo: true,         // 启用 demo 容器  ::: demo
    //   repl: {             // 启用 代码演示容器
    //     go: true,         // ::: go-repl
    //     rust: true,       // ::: rust-repl
    //     kotlin: true,     // ::: kotlin-repl
    //     python: true,     // ::: python-repl
    //   },
    //   math: {             // 启用数学公式
    //     type: 'katex',
    //   },
    //   chartjs: true,      // 启用 chart.js
    //   echarts: true,      // 启用 ECharts
    //   mermaid: true,      // 启用 mermaid
    //   flowchart: true,    // 启用 flowchart
    //   image: {
      image: {
        lazyload: true,
        figure: true,
        mark: true,
        size: true,
      },
    //   include: true,      // 在 Markdown 文件中导入其他 markdown 文件内容
    //   imageSize: 'local', // 启用 自动填充 图片宽高属性，避免页面抖动
    },

    /**
     * 水印
     * @see https://theme-plume.vuejs.press/guide/features/watermark/
     */
    // watermark: true,

    /**
     * 评论 comments
     * @see https://theme-plume.vuejs.press/guide/features/comments/
     */
    comment: {
      provider: 'Giscus', // "Artalk" | "Giscus" | "Twikoo" | "Waline"
      comment: true,
      repo: 'vpn04/vpnnew.net',
      repoId: 'R_kgDOP8f1Tw',
      category: 'Announcements',
      categoryId: 'DIC_kwDOP8f1T84C5TCz',
      mapping: 'pathname',
      reactionsEnabled: true,
      inputPosition: 'top',
    },

    /**
     * 资源链接替换
     * @see https://theme-plume.vuejs.press/guide/features/replace-assets/
     */
    // replaceAssets: 'https://cdn.example.com',

    /**
     * 加密功能
     * @see https://theme-plume.vuejs.press/guide/features/encryption/
     */
    // encrypt: {},
  }),
})
