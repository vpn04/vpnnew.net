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
const siteImage = `${siteUrl}/youyou.png`
const siteKeywords =
  'VPN推荐,翻墙机场,机场评测,Clash教程,Shadowrocket,科学上网,ChatGPT访问,Claude,Gemini'

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: siteTitle,
  description: siteDescription,
  plugins: [
    googleAnalyticsPlugin({
      id: 'G-ZH70TFW573',
    }),
  ],

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', href: '/youyou.png' }],
    ['link', { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' }],
    ['link', { rel: 'preconnect', href: 'https://www.googletagmanager.com' }],
    ['link', { rel: 'dns-prefetch', href: 'https://giscus.app' }],
    ['link', { rel: 'preconnect', href: 'https://giscus.app' }],

    ['meta', { name: 'keywords', content: siteKeywords }],
    ['meta', { name: 'author', content: 'YouYou' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    ['meta', { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' }],
    ['meta', { name: 'format-detection', content: 'telephone=no' }],
    ['meta', { name: 'theme-color', content: '#2563eb' }],
    ['meta', { property: 'og:site_name', content: siteTitle }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: siteTitle }],
    ['meta', { property: 'og:description', content: siteDescription }],
    ['meta', { property: 'og:url', content: siteUrl }],
    ['meta', { property: 'og:image', content: siteImage }],
    ['meta', { property: 'og:image:alt', content: siteTitle }],
    ['meta', { property: 'og:locale', content: siteLocale }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@youyouvpn' }],
    ['meta', { name: 'twitter:creator', content: '@youyouvpn' }],
    ['meta', { name: 'twitter:title', content: siteTitle }],
    ['meta', { name: 'twitter:description', content: siteDescription }],
    ['meta', { name: 'twitter:image', content: siteImage }],
    ['meta', { name: 'twitter:image:alt', content: siteTitle }],
    ['link', { rel: 'canonical', href: siteUrl }],
    [
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteTitle,
        url: `${siteUrl}/`,
        description: siteDescription,
        inLanguage: 'zh-CN',
        publisher: {
          '@type': 'Organization',
          name: 'YouYou',
          url: `${siteUrl}/`,
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/youyou.png`,
          },
          sameAs: ['https://t.me/youyouvpn', 'https://github.com/vpn04/vpnnew.net'],
        },
      }),
    ],
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
        author: {
          name: siteAuthor,
          url: `${siteUrl}/`,
          email: 'yyo649929@gmail.com',
        },
        isArticle: page => Boolean(page.filePathRelative && page.path !== '/' && !page.frontmatter.home),
      },
    },
    footer: {
      message: "© 2026 YouYou | VPN评测与科学上网指南 📧 <a href='mailto:yyo649929@gmail.com'>联系我</a>",
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
