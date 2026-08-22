<script setup lang="ts">
import { blogPostData } from '@internal/blogData'
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vuepress/client'

type RankingTab = 'airports' | 'tutorials'

type AnalyticsPageStats = {
  path: string
  title: string
  total: number
  today: number
  month: number
  year: number
}

type AnalyticsPagesResponse = {
  ok: boolean
  pages?: AnalyticsPageStats[]
}

type BlogPostMeta = {
  path: string
  title?: string
  categoryList?: Array<{ name: string }>
  tags?: string[]
}

type CuratedRankingItem = {
  path: string
  title: string
}

type RankingItem = {
  path: string
  title: string
  views: number
}

const route = useRoute()
const activeTab = ref<RankingTab>('airports')
const loading = ref(false)
const error = ref('')
const pageStatsMap = ref(new Map<string, AnalyticsPageStats>())
const teleportTarget = shallowRef<HTMLElement | null>(null)
let refreshTimer: number | undefined
let targetObserver: MutationObserver | undefined
let targetTimer: number | undefined

const publicCountThreshold = 10000
const displayLimit = 15

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

const isBlogPage = computed(() => route.path === '/blog/' || route.path.startsWith('/blog/'))

const normalizePath = (path: string): string => path.replace(/\/?$/, '/')

const dedupeCuratedItems = (items: CuratedRankingItem[]): CuratedRankingItem[] => {
  const seen = new Set<string>()
  const result: CuratedRankingItem[] = []

  for (const item of items) {
    const path = normalizePath(item.path)
    if (seen.has(path))
      continue

    seen.add(path)
    result.push({
      ...item,
      path,
    })
  }

  return result.slice(0, displayLimit)
}

const blogPostMap = new Map(
  (blogPostData as BlogPostMeta[]).map(post => [normalizePath(post.path), post]),
)

const curatedAirportPages = dedupeCuratedItems([
  { path: '/blog/runway/', title: '拼好连机场' },
  { path: '/vpn/lvpn-review-2026/', title: '边界云机场' },
  { path: '/vpn/yuzhouyun-review-2026/', title: '宇宙云机场' },
  { path: '/article/wangjikuaiche/', title: '网际快车机场' },
  { path: '/article/edge-x-review-2026/', title: 'Edge-X 机场' },
  { path: '/article/edgenova-review-2026/', title: 'Edgenova 机场' },
  { path: '/article/speedworld-review-2026/', title: '速界机场' },
  { path: '/article/ccyz/', title: 'ccyz 机场' },
  { path: '/article/XXYUN/', title: 'XXYUN 机场' },
  { path: '/article/guangnianti/', title: '光年梯机场' },
  { path: '/vpn/kuajieyun-review-2026/', title: '跨界云机场' },
  { path: '/vpn/wuyoulianjie-review-2026/', title: '无忧链接机场' },
  { path: '/vpn/tiziyun-review-2026/', title: '梯子云机场' },
  { path: '/vpn/shanyue-review-2026/', title: '闪跃机场' },
  { path: '/article/ermaoyun-review-2026/', title: '二猫云机场' },
])

const airportPathSet = new Set(curatedAirportPages.map(item => item.path))

const curatedTutorialPages = dedupeCuratedItems([
  { path: '/vpn-recommend/', title: '2026年翻墙机场推荐评测｜稳定便宜VPN机场排行榜（高性价比科学上网工具长期更新）' },
  { path: '/airport/jichangpk/', title: '全网最全推荐！2026翻墙机场性能与价格对比榜,实测百家机场：哪家最稳？哪家最便宜？（持续更新）' },
  { path: '/scamvpn/paolujichang/', title: '⚠️2026年VPN机场跑路名单汇总｜机场跑路黑名单、跑路原因与避坑指南' },
  { path: '/scamvpn/Clashquanpingtai/', title: 'Clash 全平台使用教程' },
  { path: '/article/Shadowrocket/', title: 'Shadowrocket 小火箭教程' },
  { path: '/article/ClashforAndroid/', title: 'Clash for Android 使用指南' },
  { path: '/scamvpn/Clashjiaocheng/', title: 'Clash 系统代理与 TUN 教程' },
  { path: '/article/freeAppleID/', title: '免费共享美区 Apple ID' },
  { path: '/article/shadowrocket-node-timeout-config-invalid-slow-2026/', title: 'Shadowrocket 节点超时排查' },
  { path: '/article/clash-google-not-working-ultimate-guide/', title: 'Clash 打不开 Google 修复指南' },
  { path: '/article/shadowrocket-node-buy-guide/', title: 'Shadowrocket 节点购买与订阅教程' },
  { path: '/article/ai-tools-access-guide-2026/', title: 'Claude / Gemini / ChatGPT 访问方法' },
  { path: '/article/aigongjujiejue/', title: 'AI工具被封解决方案' },
  { path: '/article/ChatGPTwufashiyong/', title: 'ChatGPT 无法使用解决方法' },
  { path: '/article/ChatGPTzhinan/', title: 'ChatGPT 新手入门指南' },
]).filter(item => !airportPathSet.has(item.path))

const rankingPaths = Array.from(new Set([
  ...curatedAirportPages.map(item => item.path),
  ...curatedTutorialPages.map(item => item.path),
]))

const toRankingItem = (item: CuratedRankingItem): RankingItem => {
  const path = normalizePath(item.path)
  const meta = blogPostMap.get(path)
  const stats = pageStatsMap.value.get(path)
  const title = stats?.title || meta?.title || item.title

  return {
    path,
    title,
    views: stats?.total || 0,
  }
}

const airportPages = computed(() => curatedAirportPages.map(toRankingItem))
const tutorialPages = computed(() => curatedTutorialPages.map(toRankingItem))
const visiblePages = computed(() => activeTab.value === 'airports' ? airportPages.value : tutorialPages.value)

const tabs: Array<{ key: RankingTab, label: string }> = [
  { key: 'airports', label: '机场热度' },
  { key: 'tutorials', label: '教程排行' },
]

const formatPublicCount = (value: number): string => {
  if (value >= publicCountThreshold)
    return value.toLocaleString('zh-CN')

  return value > 0 ? '热度上升' : '累计中'
}

const getEmptyText = (): string => {
  if (loading.value)
    return '正在读取热度数据...'

  if (error.value)
    return '统计同步中'

  return activeTab.value === 'airports' ? '暂无机场热度数据' : '暂无教程排行数据'
}

const clearTarget = (): void => {
  teleportTarget.value = null
}

const resolveTarget = async (): Promise<void> => {
  if (typeof document === 'undefined')
    return

  await nextTick()

  if (!isBlogPage.value) {
    clearTarget()
    return
  }

  const aside = document.querySelector<HTMLElement>('.vp-blog-aside')
  if (!aside) {
    clearTarget()
    return
  }

  let mount = aside.querySelector<HTMLElement>('#youyou-hot-ranking-mount')
  if (!mount) {
    mount = document.createElement('div')
    mount.id = 'youyou-hot-ranking-mount'
    mount.className = 'youyou-hot-ranking-mount'

    const nav = aside.querySelector<HTMLElement>('.vp-blog-nav')
    if (nav)
      nav.insertAdjacentElement('afterend', mount)
    else
      aside.appendChild(mount)
  }

  teleportTarget.value = mount
}

const scheduleTargetResolve = (): void => {
  if (typeof window === 'undefined')
    return

  if (targetTimer)
    window.clearTimeout(targetTimer)

  targetTimer = window.setTimeout(() => {
    void resolveTarget()
  }, 120)
}

const fetchPageStats = async (): Promise<void> => {
  if (!isBlogPage.value || loading.value)
    return

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${endpoint}/pages`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ paths: rankingPaths }),
      credentials: 'omit',
    })

    if (!response.ok)
      throw new Error(`统计接口返回 ${response.status}`)

    const data = await response.json() as AnalyticsPagesResponse
    if (!data.ok)
      throw new Error('统计接口返回异常')

    pageStatsMap.value = new Map(
      (data.pages || []).map(item => [normalizePath(item.path), item]),
    )
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '统计接口暂不可用'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  scheduleTargetResolve()
  void fetchPageStats()

  targetObserver = new MutationObserver(() => {
    scheduleTargetResolve()
  })
  targetObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })

  refreshTimer = window.setInterval(() => {
    void fetchPageStats()
  }, 60000)
})

watch(
  () => route.path,
  () => {
    activeTab.value = 'airports'
    scheduleTargetResolve()
    void fetchPageStats()
  },
)

onUnmounted(() => {
  targetObserver?.disconnect()

  if (refreshTimer)
    window.clearInterval(refreshTimer)

  if (targetTimer)
    window.clearTimeout(targetTimer)
})
</script>

<template>
  <Teleport v-if="teleportTarget && isBlogPage" :to="teleportTarget">
    <section class="youyou-hot-ranking" aria-label="机场与教程热度排行">
      <div class="youyou-hot-ranking__tabs" role="tablist" aria-label="机场与教程热度分类">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="{ active: activeTab === tab.key }"
          role="tab"
          :aria-selected="activeTab === tab.key"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <ol v-if="visiblePages.length" class="youyou-hot-ranking__list">
        <li v-for="(item, index) in visiblePages" :key="`${activeTab}-${item.path}`">
          <span :class="['youyou-hot-ranking__rank', { 'is-hot': index < 3 }]">{{ index + 1 }}</span>
          <a :href="item.path" :title="item.title">{{ item.title }}</a>
          <span class="youyou-hot-ranking__count">{{ formatPublicCount(item.views) }}</span>
        </li>
      </ol>

      <div v-else class="youyou-hot-ranking__empty">
        {{ getEmptyText() }}
      </div>
    </section>
  </Teleport>
</template>
