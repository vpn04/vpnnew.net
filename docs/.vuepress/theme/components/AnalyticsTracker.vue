<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import { usePageData, useRoute } from 'vuepress/client'

type AnalyticsPageStats = {
  path: string
  title: string
  total: number
  today: number
  month: number
  year: number
}

type AnalyticsViewResponse = {
  ok: boolean
  page?: AnalyticsPageStats
}

type AnalyticsPagesResponse = {
  ok: boolean
  pages?: AnalyticsPageStats[]
}

const route = useRoute()
const page = usePageData()

const getAnalyticsEndpoint = (): string => {
  const configuredEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined
  if (configuredEndpoint)
    return configuredEndpoint.replace(/\/$/, '')

  if (
    typeof window !== 'undefined'
    && ['127.0.0.1', 'localhost'].includes(window.location.hostname)
  ) {
    return 'http://127.0.0.1:8787'
  }

  return '/api/analytics'
}

const endpoint = getAnalyticsEndpoint()
let lastTrackedPath = ''
let lastListSignature = ''
let stopRouteWatch: (() => void) | undefined
let trackTimer: number | undefined
let listTimer: number | undefined
let listObserver: MutationObserver | undefined

const viewIcon = [
  '<svg class="youyou-views-icon" viewBox="0 0 24 24" aria-hidden="true">',
  '<path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />',
  '</svg>',
].join('')

const publicCountThreshold = 10000

const formatNumber = (value: number): string => value.toLocaleString('zh-CN')

const getPublicPageTexts = (stats: AnalyticsPageStats): { total: string, today: string, month: string, title: string } => {
  const total = formatNumber(stats.total)
  const today = formatNumber(stats.today)
  const month = formatNumber(stats.month)

  if (stats.total >= publicCountThreshold) {
    return {
      total: `PV ${total}`,
      today: `今日 ${today}`,
      month: `本月 ${month}`,
      title: `总浏览 ${total}，今日 ${today}，本月 ${month}`,
    }
  }

  return {
    total: stats.total > 0 ? '热度上升' : '新内容',
    today: stats.today > 0 ? '今日有访问' : '今日升温中',
    month: stats.month > 0 ? '本月活跃' : '本月累计中',
    title: '公开展示热度趋势，真实浏览数据由站点统计系统记录',
  }
}

const getPublicListTexts = (stats?: AnalyticsPageStats): { total: string, today: string, title: string } => {
  if (!stats) {
    return {
      total: '热度累计中',
      today: '今日升温中',
      title: '公开展示热度趋势，真实浏览数据由站点统计系统记录',
    }
  }

  const total = formatNumber(stats.total)
  const today = formatNumber(stats.today)

  if (stats.total >= publicCountThreshold) {
    return {
      total: `PV ${total}`,
      today: `今日 ${today}`,
      title: `总浏览 ${total}，今日 ${today}`,
    }
  }

  return {
    total: stats.total > 0 ? '热度上升' : '热度累计中',
    today: stats.today > 0 ? '今日有访问' : '今日升温中',
    title: '公开展示热度趋势，真实浏览数据由站点统计系统记录',
  }
}

const isArticlePage = (): boolean => {
  const relativePath = String(page.value.filePathRelative || '').replace(/\\/g, '/')
  const path = route.path

  if (relativePath.startsWith('blog/'))
    return true

  if (path.startsWith('/article/') || path.startsWith('/scamvpn/'))
    return true

  return false
}

const ensureBadge = (): HTMLElement | undefined => {
  if (typeof document === 'undefined' || !isArticlePage())
    return undefined

  const heading = document.querySelector<HTMLElement>('.vp-doc h1')
  if (!heading)
    return undefined

  let badge = document.querySelector<HTMLElement>('.youyou-page-views')
  if (!badge) {
    badge = document.createElement('div')
    badge.className = 'youyou-page-views'
    badge.setAttribute('aria-live', 'polite')
    heading.insertAdjacentElement('afterend', badge)
  }

  return badge
}

const setBadgeLoading = (): void => {
  const badge = ensureBadge()
  if (!badge)
    return

  badge.innerHTML = [
    viewIcon,
    '<span>PV 同步中</span>',
  ].join('')
}

const setBadgeStats = (stats: AnalyticsPageStats): void => {
  const badge = ensureBadge()
  if (!badge)
    return

  const texts = getPublicPageTexts(stats)
  badge.innerHTML = [
    viewIcon,
    `<span>${texts.total}</span>`,
    `<span>${texts.today}</span>`,
    `<span>${texts.month}</span>`,
  ].join('')
  badge.title = texts.title
}

const setBadgeOffline = (): void => {
  const badge = ensureBadge()
  if (!badge)
    return

  badge.innerHTML = [
    '<span class="youyou-views-icon-dot is-offline"></span>',
    '<span>PV 待同步</span>',
  ].join('')
}

const removeBadge = (): void => {
  document.querySelector('.youyou-page-views')?.remove()
}

const getListTargets = (): Array<{ path: string, badge: HTMLElement }> => {
  if (typeof window === 'undefined' || typeof document === 'undefined')
    return []

  return Array.from(document.querySelectorAll<HTMLElement>('.vp-blog-post-item, .vp-post-item')).flatMap((item) => {
    const link = item.querySelector<HTMLAnchorElement>('h3 a[href]')
    const meta = item.querySelector<HTMLElement>('.post-engagement') ||
      item.querySelector<HTMLElement>('.post-meta') ||
      item.querySelector<HTMLElement>('h3')

    if (!link || !meta)
      return []

    const url = new URL(link.href, window.location.origin)
    const path = decodeURI(url.pathname)

    let badge = item.querySelector<HTMLElement>('.youyou-list-views')
    if (!badge) {
      badge = document.createElement('span')
      badge.className = 'youyou-list-views'
      badge.setAttribute('aria-live', 'polite')
      meta.appendChild(badge)
    }

    return [{ path, badge }]
  })
}

const setListBadge = (badge: HTMLElement, totalText: string, todayText = '', offline = false): void => {
  badge.classList.toggle('is-offline', offline)
  badge.innerHTML = [
    offline ? '<span class="youyou-views-icon-dot is-offline"></span>' : viewIcon,
    `<span>${totalText}</span>`,
    todayText ? `<span class="youyou-list-views__today">${todayText}</span>` : '',
  ].join('')
}

const hydrateListViews = async (): Promise<void> => {
  if (typeof window === 'undefined')
    return

  await nextTick()

  const targets = getListTargets()
  if (!targets.length) {
    lastListSignature = ''
    return
  }

  const uniquePaths = Array.from(new Set(targets.map(item => item.path))).slice(0, 60)
  const signature = uniquePaths.join('|')
  if (signature === lastListSignature)
    return

  lastListSignature = signature

  targets.forEach(({ badge }) => {
    setListBadge(badge, 'PV ...')
  })

  try {
    const response = await fetch(`${endpoint}/pages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ paths: uniquePaths }),
      credentials: 'omit',
    })

    if (!response.ok)
      throw new Error(`Analytics pages request failed: ${response.status}`)

    const data = await response.json() as AnalyticsPagesResponse
    if (!data.ok || !data.pages)
      throw new Error('Analytics pages response is invalid')

    const pageMap = new Map(data.pages.map(item => [item.path, item]))
    targets.forEach(({ path, badge }) => {
      const stats = pageMap.get(path)
      if (!stats) {
        const texts = getPublicListTexts()
        setListBadge(badge, texts.total, texts.today)
        badge.title = texts.title
        return
      }

      const texts = getPublicListTexts(stats)
      setListBadge(
        badge,
        texts.total,
        texts.today,
      )
      badge.title = texts.title
    })
  }
  catch {
    targets.forEach(({ badge }) => {
      setListBadge(badge, 'PV --', '待同步', true)
    })
  }
}

const scheduleListViews = (): void => {
  if (typeof window === 'undefined')
    return

  if (listTimer)
    window.clearTimeout(listTimer)

  listTimer = window.setTimeout(() => {
    void hydrateListViews()
  }, 450)
}

const trackPageView = async (): Promise<void> => {
  if (typeof window === 'undefined')
    return

  const path = route.path
  if (!path || path === lastTrackedPath)
    return

  lastTrackedPath = path

  await nextTick()

  if (isArticlePage())
    setBadgeLoading()
  else
    removeBadge()

  try {
    const response = await fetch(`${endpoint}/view`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        path,
        title: page.value.title || document.title,
        referrer: document.referrer || '',
      }),
      keepalive: true,
      credentials: 'omit',
    })

    if (!response.ok)
      throw new Error(`Analytics request failed: ${response.status}`)

    const data = await response.json() as AnalyticsViewResponse
    if (data.ok && data.page)
      setBadgeStats(data.page)
    else
      setBadgeOffline()
  }
  catch {
    setBadgeOffline()
  }
}

onMounted(() => {
  stopRouteWatch = watch(
    () => route.path,
    () => {
      if (trackTimer)
        window.clearTimeout(trackTimer)

      trackTimer = window.setTimeout(() => {
        void trackPageView()
        scheduleListViews()
      }, 350)
    },
    { immediate: true },
  )

  scheduleListViews()

  listObserver = new MutationObserver(() => {
    scheduleListViews()
  })
  listObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })
})

onUnmounted(() => {
  stopRouteWatch?.()
  listObserver?.disconnect()

  if (trackTimer)
    window.clearTimeout(trackTimer)

  if (listTimer)
    window.clearTimeout(listTimer)
})
</script>

<template>
  <span hidden aria-hidden="true" />
</template>
