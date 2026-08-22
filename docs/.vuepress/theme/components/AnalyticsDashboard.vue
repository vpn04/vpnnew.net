<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type RangeKey = 'today' | 'month' | 'year' | 'all'

type AnalyticsMetric = {
  total: number
  today: number
  month: number
  year: number
}

type AnalyticsTopPage = {
  path: string
  title: string
  views: number
  total: number
}

type AnalyticsPageStats = {
  path: string
  title: string
  total: number
  today: number
  month: number
  year: number
}

type AnalyticsSummary = {
  ok: boolean
  generatedAt: string
  site: AnalyticsMetric
  top: Record<RangeKey, AnalyticsTopPage[]>
}

type AnalyticsPagesResponse = {
  ok: boolean
  pages?: AnalyticsPageStats[]
}

type PinnedHotPage = {
  path: string
  title: string
}

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
const loading = ref(true)
const error = ref('')
const activeRange = ref<RangeKey>('today')
const summary = ref<AnalyticsSummary | null>(null)
const pinnedPageStats = ref(new Map<string, AnalyticsPageStats>())
let refreshTimer: ReturnType<typeof window.setInterval> | undefined
const publicCountThreshold = 10000
const rankingDisplayLimit = 15

const normalizePath = (path: string): string => path.replace(/\/?$/, '/')

const pinnedHotPages: PinnedHotPage[] = [
  { path: '/vpn-recommend/', title: '2026年翻墙机场推荐评测｜稳定便宜VPN机场排行榜（高性价比科学上网工具长期更新）' },
  { path: '/airport/jichangpk/', title: '全网最全推荐！2026翻墙机场性能与价格对比榜,实测百家机场：哪家最稳？哪家最便宜？（持续更新）' },
  { path: '/scamvpn/paolujichang/', title: '⚠️2026年VPN机场跑路名单汇总｜机场跑路黑名单、跑路原因与避坑指南' },
]

const pinnedHotPathSet = new Set(pinnedHotPages.map(item => normalizePath(item.path)))

const fallbackHotPages: PinnedHotPage[] = [
  { path: '/article/airport-subscription-clash-shadowrocket-guide-2026/', title: '机场订阅链接怎么用？Clash / Shadowrocket 导入订阅完整教程' },
  { path: '/scamvpn/Clashquanpingtai/', title: '2026最新版 Clash 全平台使用教程' },
  { path: '/article/Shadowrocket/', title: 'Shadowrocket 小火箭 2026 年使用指南' },
  { path: '/article/ClashVerge/', title: '2026年 Clash Verge 全平台配置指南' },
  { path: '/article/ClashforAndroid/', title: 'Clash for Android 2026年使用指南' },
  { path: '/article/freeAppleID/', title: '2026年免费共享美区 Apple ID 每日更新' },
  { path: '/article/ai-tools-network-guide-2026/', title: '2026年AI工具打不开怎么办？稳定访问全流程教程' },
  { path: '/article/ai-tools-access-guide-2026/', title: 'Claude / Gemini / ChatGPT 访问方法终极指南' },
  { path: '/article/clash-google-not-working-ultimate-guide/', title: 'Clash打不开Google怎么办？逐步排查修复指南' },
  { path: '/article/shadowrocket-node-timeout-config-invalid-slow-2026/', title: 'Shadowrocket 节点超时与配置失效排查' },
  { path: '/article/shadowrocket-node-buy-guide/', title: 'Shadowrocket节点哪里买？订阅与更新教程' },
  { path: '/article/aigongjujiejue/', title: 'AI工具被封如何解决？VPN稳定访问方案' },
  { path: '/article/ChatGPTwufashiyong/', title: 'ChatGPT无法使用怎么办？地区限制解决方法' },
  { path: '/article/ChatGPTzhinan/', title: '如何使用 ChatGPT：2026 新手入门指南' },
  { path: '/scamvpn/Clashjiaocheng/', title: '2026最新Clash 教程：系统代理模式与 TUN 模式' },
]

const trackedHotPages = [
  ...pinnedHotPages,
  ...fallbackHotPages,
]

const ranges: Array<{ key: RangeKey, label: string, short: string }> = [
  { key: 'today', label: '今日', short: '24H' },
  { key: 'month', label: '本月', short: 'M' },
  { key: 'year', label: '今年', short: 'Y' },
  { key: 'all', label: '总榜', short: 'ALL' },
]

const cards = computed(() => {
  const site = summary.value?.site
  return [
    { label: '今日', value: site?.today ?? 0, hint: 'Today', tone: 'blue', activeText: '今日有访问' },
    { label: '本月', value: site?.month ?? 0, hint: 'Month', tone: 'green', activeText: '本月活跃' },
    { label: '今年', value: site?.year ?? 0, hint: 'Year', tone: 'amber', activeText: '持续增长' },
    { label: '总热度', value: site?.total ?? 0, hint: 'Heat', tone: 'violet', activeText: '热度上升' },
  ]
})

const getPinnedViews = (stats: AnalyticsPageStats | undefined, range: RangeKey): number => {
  if (!stats)
    return 0

  return range === 'all' ? stats.total : stats[range]
}

const topPages = computed(() => {
  const range = activeRange.value
  const sourcePages = (summary.value?.top?.[range] || []).map(item => ({
    ...item,
    path: normalizePath(item.path),
  }))
  const sourceMap = new Map(sourcePages.map(item => [item.path, item]))
  const result: AnalyticsTopPage[] = []
  const seen = new Set<string>()
  const toCuratedTopPage = (item: PinnedHotPage): AnalyticsTopPage => {
    const path = normalizePath(item.path)
    const stats = pinnedPageStats.value.get(path)
    const source = sourceMap.get(path)

    return {
      path,
      title: stats?.title || source?.title || item.title,
      views: getPinnedViews(stats, range) || source?.views || 0,
      total: stats?.total || source?.total || 0,
    }
  }
  const pushPage = (item: AnalyticsTopPage): void => {
    const path = normalizePath(item.path)
    if (seen.has(path) || result.length >= rankingDisplayLimit)
      return

    seen.add(path)
    result.push({
      ...item,
      path,
    })
  }

  pinnedHotPages.map(toCuratedTopPage).forEach(pushPage)
  sourcePages.filter(item => !pinnedHotPathSet.has(item.path)).forEach(pushPage)
  fallbackHotPages.map(toCuratedTopPage).forEach(pushPage)

  return result
})
const maxViews = computed(() => Math.max(...topPages.value.map(item => item.views), 1))
const leader = computed(() => topPages.value[0])
const activeRangeLabel = computed(() => ranges.find(item => item.key === activeRange.value)?.label || '今日')

const formatNumber = (value: number): string => value.toLocaleString('zh-CN')

const formatCompact = (value: number): string => {
  if (value >= 10000)
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}w`

  return formatNumber(value)
}

const formatPublicCount = (value: number, activeText = '热度上升'): string => {
  if (value >= publicCountThreshold)
    return formatCompact(value)

  return value > 0 ? activeText : '累计中'
}

const formatTime = (value?: string): string => {
  if (!value)
    return '等待同步'

  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return '等待同步'

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const fetchPinnedPageStats = async (): Promise<void> => {
  const response = await fetch(`${endpoint}/pages`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ paths: trackedHotPages.map(item => item.path) }),
    credentials: 'omit',
  })

  if (!response.ok)
    return

  const data = await response.json() as AnalyticsPagesResponse
  if (!data.ok)
    return

  pinnedPageStats.value = new Map(
    (data.pages || []).map(item => [normalizePath(item.path), item]),
  )
}

const fetchSummary = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${endpoint}/summary`, {
      headers: { accept: 'application/json' },
      credentials: 'omit',
    })

    if (!response.ok)
      throw new Error(`统计接口返回 ${response.status}`)

    const data = await response.json() as AnalyticsSummary
    if (!data.ok)
      throw new Error('统计接口返回异常')

    summary.value = data
    await fetchPinnedPageStats()
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '统计接口暂不可用'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchSummary()
  refreshTimer = window.setInterval(() => {
    void fetchSummary()
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer)
    window.clearInterval(refreshTimer)
})
</script>

<template>
  <div class="analytics-dashboard">
    <section class="analytics-overview">
      <div class="analytics-overview__main">
        <p class="analytics-kicker">
          YouYou Analytics
        </p>
        <h1>站点热度</h1>
        <p>公开展示文章热度趋势、今日活跃、月度表现和热门文章排行。</p>
      </div>

      <div class="analytics-status">
        <span :class="['analytics-status__dot', { 'is-error': error }]" />
        <span>{{ error ? '接口待连接' : loading ? '同步中' : '实时在线' }}</span>
        <small>{{ formatTime(summary?.generatedAt) }}</small>
        <button type="button" :disabled="loading" @click="fetchSummary">
          {{ loading ? '...' : '刷新' }}
        </button>
      </div>
    </section>

    <div v-if="error" class="analytics-alert">
      <strong>统计接口未连接</strong>
      <span>本地预览请保持 <code>127.0.0.1:8787</code> Worker 运行；线上请绑定 <code>/api/analytics</code>。</span>
      <small>{{ error }}</small>
    </div>

    <section class="analytics-metrics" aria-label="全站浏览概览">
      <article v-for="card in cards" :key="card.label" :class="['analytics-metric', `is-${card.tone}`]">
        <span>{{ card.label }}</span>
        <strong>{{ formatPublicCount(card.value, card.activeText) }}</strong>
        <small>{{ card.hint }}</small>
      </article>
    </section>

    <section class="analytics-insight">
      <div class="analytics-leader">
        <p class="analytics-kicker">
          Hot Now
        </p>
        <h2>{{ leader?.title || '等待产生热门文章' }}</h2>
        <p>{{ leader ? leader.path : '部署统计接口并产生访问后，这里会显示当前最热内容。' }}</p>
        <strong>{{ formatPublicCount(leader?.views || 0) }}</strong>
        <span>{{ activeRangeLabel }}热度</span>
      </div>

      <div class="analytics-range">
        <button
          v-for="range in ranges"
          :key="range.key"
          type="button"
          :class="{ active: activeRange === range.key }"
          @click="activeRange = range.key"
        >
          <span>{{ range.short }}</span>
          {{ range.label }}
        </button>
      </div>
    </section>

    <section class="analytics-panel">
      <div class="analytics-panel__head">
        <div>
          <p class="analytics-kicker">
            Ranking
          </p>
          <h2>热门文章排行</h2>
        </div>
        <p>{{ activeRangeLabel }} · 最后同步 {{ formatTime(summary?.generatedAt) }}</p>
      </div>

      <ol v-if="topPages.length" class="analytics-ranking">
        <li v-for="(item, index) in topPages" :key="`${item.path}-${activeRange}`">
          <span class="analytics-rank">{{ index + 1 }}</span>
          <a :href="item.path">
            <strong>{{ item.title || item.path }}</strong>
            <small>{{ item.path }}</small>
          </a>
          <div class="analytics-bar" aria-hidden="true">
            <span :style="{ width: `${Math.max((item.views / maxViews) * 100, 5)}%` }" />
          </div>
          <em>{{ formatPublicCount(item.views) }}</em>
        </li>
      </ol>

      <div v-else class="analytics-empty">
        {{ loading ? '正在读取统计数据...' : '暂无统计数据，产生访问后会显示排行。' }}
      </div>
    </section>
  </div>
</template>

<style scoped>
.analytics-dashboard {
  display: grid;
  gap: 18px;
  max-width: 1120px;
  margin: 0 auto;
}

.analytics-overview,
.analytics-alert,
.analytics-metric,
.analytics-leader,
.analytics-panel {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.analytics-overview {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.1), transparent 34%),
    linear-gradient(315deg, rgba(20, 184, 166, 0.1), transparent 32%),
    var(--vp-c-bg-soft);
}

.analytics-overview__main {
  min-width: 0;
}

.analytics-kicker {
  margin: 0 0 8px;
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.analytics-overview h1,
.analytics-panel h2,
.analytics-leader h2 {
  margin: 0;
  color: var(--vp-c-text-1);
}

.analytics-overview h1 {
  font-size: 30px;
  line-height: 1.15;
}

.analytics-overview p:not(.analytics-kicker),
.analytics-panel__head p,
.analytics-leader p,
.analytics-metric small,
.analytics-ranking small,
.analytics-alert span,
.analytics-alert small {
  color: var(--vp-c-text-2);
}

.analytics-status {
  display: grid;
  grid-template-columns: auto auto;
  gap: 4px 8px;
  align-items: center;
  min-width: 168px;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
}

.analytics-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.12);
}

.analytics-status__dot.is-error {
  background: #f59e0b;
  box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.14);
}

.analytics-status span {
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 800;
}

.analytics-status small {
  grid-column: 1 / -1;
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.analytics-status button,
.analytics-range button {
  min-height: 32px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-weight: 800;
}

.analytics-status button {
  grid-column: 1 / -1;
}

.analytics-status button:hover,
.analytics-range button.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

.analytics-alert {
  display: grid;
  gap: 5px;
  padding: 14px 16px;
}

.analytics-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.analytics-metric {
  position: relative;
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 16px;
  overflow: hidden;
}

.analytics-metric::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  content: "";
}

.analytics-metric.is-blue::before {
  background: #2563eb;
}

.analytics-metric.is-green::before {
  background: #14b8a6;
}

.analytics-metric.is-amber::before {
  background: #f59e0b;
}

.analytics-metric.is-violet::before {
  background: #8b5cf6;
}

.analytics-metric span {
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 700;
}

.analytics-metric strong {
  color: var(--vp-c-text-1);
  font-size: 28px;
  line-height: 1;
}

.analytics-insight {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 14px;
}

.analytics-leader {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 18px;
  align-items: end;
  padding: 20px;
}

.analytics-leader h2,
.analytics-leader p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analytics-leader strong {
  grid-row: 1 / 4;
  grid-column: 2;
  color: var(--vp-c-text-1);
  font-size: 34px;
  line-height: 1;
}

.analytics-leader > span {
  grid-column: 2;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.analytics-range {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.analytics-range button {
  display: grid;
  place-items: center;
  padding: 8px;
  font-size: 13px;
}

.analytics-range span {
  font-size: 11px;
  opacity: 0.75;
}

.analytics-panel {
  padding: 20px;
}

.analytics-panel__head {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.analytics-ranking {
  display: grid;
  gap: 9px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.analytics-ranking li {
  display: grid;
  grid-template-columns: 34px minmax(0, 1.45fr) minmax(110px, 0.75fr) 70px;
  gap: 10px;
  align-items: center;
  padding: 11px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
}

.analytics-rank {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 900;
}

.analytics-ranking a {
  display: grid;
  gap: 3px;
  min-width: 0;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.analytics-ranking strong,
.analytics-ranking small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analytics-bar {
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
}

.analytics-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #14b8a6);
}

.analytics-ranking em {
  color: var(--vp-c-text-1);
  font-style: normal;
  font-weight: 900;
  text-align: right;
}

.analytics-empty {
  padding: 24px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-2);
  text-align: center;
}

@media (max-width: 900px) {
  .analytics-overview,
  .analytics-panel__head {
    flex-direction: column;
  }

  .analytics-status {
    width: 100%;
  }

  .analytics-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .analytics-insight {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .analytics-overview,
  .analytics-panel,
  .analytics-leader {
    padding: 16px;
  }

  .analytics-overview h1 {
    font-size: 24px;
  }

  .analytics-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .analytics-metric strong {
    font-size: 24px;
  }

  .analytics-leader {
    grid-template-columns: 1fr;
  }

  .analytics-leader strong,
  .analytics-leader > span {
    grid-row: auto;
    grid-column: auto;
    text-align: left;
  }

  .analytics-ranking li {
    grid-template-columns: 30px minmax(0, 1fr) 58px;
  }

  .analytics-bar {
    grid-column: 2 / -1;
  }
}
</style>
