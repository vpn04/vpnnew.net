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

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'
import { googleAnalyticsPlugin } from '@vuepress/plugin-google-analytics'

const siteUrl = 'https://vpnnew.net'
const siteLocale = 'zh-CN'
const siteAuthor = 'YouYou'
const siteTitle = 'YouYou VPN推荐与机场评测'
const siteDescription =
  '提供2026最新VPN推荐、翻墙机场评测、Clash与Shadowrocket教程，覆盖ChatGPT、Claude、Google等海外服务访问与节点优化。'
const englishSiteTitle = 'YouYou VPN Reviews and China Internet Access Guides'
const englishSiteDescription =
  'English entry page for YouYou VPN reviews, airport proxy comparisons, Clash and Shadowrocket tutorials, AI access and risk warnings.'
const siteImage = `${siteUrl}/youyou.png`
const siteKeywords =
  'VPN推荐,翻墙机场,机场评测,Clash教程,Shadowrocket,科学上网,ChatGPT访问,Claude,Gemini'
const robotsDirective = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
const organizationId = `${siteUrl}/#organization`
const websiteId = `${siteUrl}/#website`
const authorId = `${siteUrl}/about/#youyou`

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

  const normalized = value.trim().replaceAll('/', '-')
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

const isArticlePage = (page: { path: string, filePathRelative?: string | null, frontmatter: Record<string, unknown> }): boolean => {
  const relative = page.filePathRelative?.replaceAll('\\', '/') || ''
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
    description: getPageDescription(head, page),
    image: [getPageImage(head, page)],
    datePublished: published,
    dateModified: modified,
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

  if (isArticlePage(page) && !hasJsonLdType(head, 'Article')) {
    schemas.push(createArticleSchema(head, page))
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

  if (schemas.length) appendJsonLd(head, schemas)
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

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

const generatedPageSeoPlugin = () => ({
  name: 'youyou-generated-page-seo',
  onGenerated: app => {
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
    ['link', { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' }],
    ['link', { rel: 'preconnect', href: 'https://www.googletagmanager.com' }],
    ['link', { rel: 'dns-prefetch', href: 'https://giscus.app' }],
    ['link', { rel: 'preconnect', href: 'https://giscus.app' }],

    ['meta', { name: 'keywords', content: siteKeywords }],
    ['meta', { name: 'author', content: 'YouYou' }],
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
          appendAlternateLanguageHead(head, page)
          appendPageStructuredData(head, page)
          dedupeSeoHead(head)
        },
      },
    },
    footer: {
      message: "© 2026 YouYou | VPN评测与科学上网指南 | <a href='/about/'>关于</a> · <a href='/methodology/'>评测方法</a> · <a href='/disclosure/'>披露</a> · <a href='/contact/'>联系</a>",
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
