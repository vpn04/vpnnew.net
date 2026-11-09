<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useId } from 'vue'
import type { AirportPlan } from '../data/airportCatalog'
import { allAirportPlans, catalogDataNotes, catalogUpdated, recommendedAirportIds } from '../data/airportCatalog'
import type { AirportSort } from '../data/airportFilter'
import { getAirportFinderResults } from '../data/airportFilter'
import { formatData, formatMoney, formatMonthlyData, formatMonthlyPrice, formatUnitPrice } from '../data/airportDisplay'

const props = withDefaults(defineProps<{ variant?: 'inline' | 'home' }>(), { variant: 'inline' })
const isHome = computed(() => props.variant === 'home')
const catalogueAirportCount = new Set(allAirportPlans.map(plan => plan.airportId)).size

const instanceId = useId()
const headingId = `${instanceId}-finder-heading`
const filterHeadingId = `${instanceId}-filter-heading`
const selectionStatusId = `${instanceId}-selection-status`
const dialog = ref<HTMLDialogElement | null>(null)
const filterHeading = ref<HTMLElement | null>(null)
const compareHeading = ref<HTMLElement | null>(null)
const selectionMessage = ref<HTMLElement | null>(null)
const device = ref('windows')
const budget = ref<number | null>(null)
const minDataGB = ref(0)
const query = ref('')
const sort = ref<AirportSort>('recommended')
const selectedIds = ref<string[]>([])
const showingComparison = ref(false)
const announcement = ref('')
let previousFocus: HTMLElement | null = null
let previousOverflow: string | undefined

const devices = [
  { id: 'windows', label: 'Windows 电脑', tutorial: 'Clash 桌面端安装与导入', path: '/article/ClashVerge/' },
  { id: 'macos', label: 'Mac 电脑', tutorial: 'Clash 桌面端安装与导入', path: '/article/ClashVerge/' },
  { id: 'linux', label: 'Linux 电脑', tutorial: 'Clash 桌面端安装与导入', path: '/article/ClashVerge/' },
  { id: 'android', label: 'Android 手机 / 平板', tutorial: 'Android 客户端安装与导入', path: '/article/ClashforAndroid/' },
  { id: 'ios', label: 'iPhone / iPad', tutorial: 'Shadowrocket 安装与导入', path: '/article/Shadowrocket/' },
  { id: 'router', label: '路由器', tutorial: '路由器配置与兼容性说明', path: '/article/luyouqi/' },
]

const selectedDevice = computed(() => devices.find(item => item.id === device.value) || devices[0])
const finderResults = computed(() => getAirportFinderResults(allAirportPlans, {
  budget: budget.value,
  minDataGB: minDataGB.value,
  query: query.value,
  sort: sort.value,
  recommendedOrder: recommendedAirportIds,
}))
const displayPlans = computed(() => finderResults.value.displayPlans)
const unverifiedCount = computed(() => displayPlans.value.filter(plan => plan.monthlyPrice === null || plan.monthlyDataGB === null).length)
const recommendedIds = new Set<string>(recommendedAirportIds)
const isRecommended = (plan: AirportPlan): boolean => recommendedIds.has(plan.airportId)
const planMap = new Map(allAirportPlans.map(plan => [plan.id, plan]))
const selectedPlans = computed(() => selectedIds.value
  .map(id => planMap.get(id))
  .filter((plan): plan is AirportPlan => Boolean(plan)))
const selectedAirports = computed(() => new Set(selectedPlans.value.map(plan => plan.airportId)))
const selectionStatus = computed(() => [
  announcement.value,
  selectedPlans.value.length === 3
    ? '已选满 3 家。移除一家后可以继续选择；同一家机场可以更换对比档位。'
    : '最多对比 3 家。修改筛选会保留已选的具体套餐，可在下方单独移除。',
].filter(Boolean).join(' '))

const sourceDateLabel = (plan: AirportPlan): string => plan.sourceDateKind === 'published' ? '原文发布' : '原文编辑'
const isSelected = (plan: AirportPlan): boolean => selectedIds.value.includes(plan.id)
const cannotSelect = (plan: AirportPlan): boolean => selectedPlans.value.length >= 3 && !selectedAirports.value.has(plan.airportId)

const restorePage = (): void => {
  if (typeof document !== 'undefined' && previousOverflow !== undefined) {
    document.body.style.overflow = previousOverflow
    previousOverflow = undefined
  }
  if (previousFocus?.isConnected)
    previousFocus.focus({ preventScroll: true })
  previousFocus = null
}

const openFinder = (): void => {
  if (!dialog.value || dialog.value.open)
    return
  // A native close event may still be queued from the previous opening.
  restorePage()
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.body.style.overflow
  dialog.value.showModal()
  document.body.style.overflow = 'hidden'
}

const closeFinder = (): void => {
  dialog.value?.close()
  restorePage()
}

const onDialogClose = (): void => {
  // Ignore a delayed close event when the dialog has already reopened.
  if (!dialog.value?.open)
    restorePage()
}

const onBackdropClick = (event: MouseEvent): void => {
  if (event.target !== dialog.value || !dialog.value)
    return
  const bounds = dialog.value.getBoundingClientRect()
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)
    closeFinder()
}

const resetFilters = (): void => {
  device.value = 'windows'
  budget.value = null
  minDataGB.value = 0
  query.value = ''
  sort.value = 'recommended'
  announcement.value = '筛选已重置，已选对比套餐保留。'
}

const changeFilters = (): void => {
  announcement.value = ''
}

const toggleSelection = (plan: AirportPlan, event: Event): void => {
  const input = event.target as HTMLInputElement
  if (!input.checked) {
    selectedIds.value = selectedIds.value.filter(id => id !== plan.id)
    announcement.value = `已移除${plan.airportName}。`
    return
  }
  const previousPlan = selectedPlans.value.find(item => item.airportId === plan.airportId)
  if (!previousPlan && selectedPlans.value.length >= 3) {
    input.checked = false
    announcement.value = '最多对比 3 家，请先移除一家。'
    return
  }
  selectedIds.value = [...selectedIds.value.filter(id => id !== previousPlan?.id), plan.id]
  announcement.value = previousPlan
    ? `已将${plan.airportName}更换为${plan.name}。`
    : `已添加${plan.airportName}，共选 ${selectedIds.value.length} 家。`
}

const showFilters = async (): Promise<void> => {
  showingComparison.value = false
  await nextTick()
  dialog.value?.querySelector<HTMLElement>('.finder-dialog__body')?.scrollTo({ top: 0 })
  filterHeading.value?.focus({ preventScroll: true })
}

const showComparison = async (): Promise<void> => {
  if (selectedPlans.value.length < 2)
    return
  showingComparison.value = true
  await nextTick()
  dialog.value?.querySelector<HTMLElement>('.finder-dialog__body')?.scrollTo({ top: 0 })
  compareHeading.value?.focus({ preventScroll: true })
}

const restoreSelectionFocus = async (focusedControl: Element | null): Promise<void> => {
  await nextTick()
  if (focusedControl && !focusedControl.isConnected && dialog.value?.open) {
    const target = showingComparison.value ? compareHeading.value : selectionMessage.value
    target?.focus({ preventScroll: true })
  }
}

const removeSelection = async (id: string): Promise<void> => {
  const focusedControl = document.activeElement
  const plan = planMap.get(id)
  selectedIds.value = selectedIds.value.filter(item => item !== id)
  announcement.value = `已移除${plan?.airportName || '所选套餐'}。`
  if (showingComparison.value && selectedPlans.value.length < 2) {
    announcement.value = '对比至少需要 2 家，已返回套餐筛选。'
    await showFilters()
  }
  else {
    await restoreSelectionFocus(focusedControl)
  }
}

const clearSelection = async (): Promise<void> => {
  const focusedControl = document.activeElement
  selectedIds.value = []
  announcement.value = '已清空对比套餐。'
  if (showingComparison.value)
    await showFilters()
  else
    await restoreSelectionFocus(focusedControl)
}

onUnmounted(() => {
  dialog.value?.close()
  restorePage()
})
</script>

<template>
  <section id="airport-plan-finder" class="airport-finder" :class="{ 'airport-finder--home': isHome }" aria-label="机场套餐筛选工具">
    <div v-if="isHome" class="finder-home-launch">
      <div class="finder-home-launch__main">
        <span class="finder-home-launch__icon" aria-hidden="true">
          <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16l-6.3 7.2v5.3l-3.4 1.8v-7.1L4 5Z" /></svg>
        </span>
        <div class="finder-home-launch__copy">
          <p class="finder-home-launch__eyebrow"><span>新功能</span> {{ catalogueAirportCount }} 家机场 · 全部可加入对比</p>
          <h2>机场筛选与套餐对比</h2>
          <p class="finder-home-launch__description">按预算和流量缩小范围，最多选择 3 家，并排比较价格与限制。</p>
          <div class="finder-home-launch__features" aria-label="工具功能">
            <span>推荐优先</span><span>预算与流量筛选</span><span>最多 3 家对比</span>
          </div>
        </div>
      </div>
      <div class="finder-home-launch__actions">
        <button type="button" class="finder-button finder-launch__button finder-home-launch__button" @click="openFinder">立即筛选机场 <span aria-hidden="true">→</span></button>
        <a href="/vpn-recommend/">查看完整机场推荐评测 <span aria-hidden="true">→</span></a>
      </div>
    </div>
    <div v-else class="finder-launch">
      <span class="finder-launch__icon" aria-hidden="true">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 5h16l-6.3 7.2v5.3l-3.4 1.8v-7.1L4 5Z" />
        </svg>
      </span>
      <div class="finder-launch__copy">
        <h2>按预算筛选机场套餐</h2>
        <p>按月付预算、流量缩小范围，最多选择 3 家对比价格与限制。</p>
      </div>
      <button type="button" class="finder-button finder-button--primary finder-launch__button" @click="openFinder">
        筛选与对比套餐 <span aria-hidden="true">→</span>
      </button>
    </div>

    <dialog ref="dialog" class="finder-dialog" :aria-labelledby="headingId" @close="onDialogClose" @click="onBackdropClick">
      <header class="finder-dialog__header">
        <div class="finder-dialog__heading-row">
          <div>
            <p class="finder-eyebrow">机场套餐工具</p>
            <h2 :id="headingId">筛选与对比套餐</h2>
          </div>
          <button type="button" class="finder-button finder-close" aria-label="关闭机场筛选工具" @click="closeFinder">
            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m5 5 10 10M15 5 5 15" /></svg>
            关闭
          </button>
        </div>
        <div class="finder-tabs" aria-label="筛选与对比视图">
          <button type="button" :class="{ 'is-active': !showingComparison }" :aria-pressed="!showingComparison" @click="showFilters">套餐筛选</button>
          <button type="button" :class="{ 'is-active': showingComparison }" :aria-pressed="showingComparison" :disabled="selectedPlans.length < 2" @click="showComparison">
            套餐对比 <span class="finder-count">{{ selectedPlans.length }} / 3</span>
          </button>
        </div>
      </header>

      <div class="finder-dialog__body">
        <div v-show="!showingComparison">
          <div class="finder-intro">
            <h3 :id="filterHeadingId" ref="filterHeading" tabindex="-1">先找适合的档位，再看评测与风险</h3>
            <p>当前收录的 {{ catalogueAirportCount }} 家机场均可加入对比，默认优先展示编辑推荐的五家。设置预算或流量门槛后，只匹配对应数字明确的资料；每家展示最低匹配档位，推荐标识不代表速度或稳定性名次。</p>
            <p v-if="unverifiedCount" class="finder-help">当前 {{ unverifiedCount }} 家按原文展示年付、流量包或不同口径的数值，均可加入对比；月付预算和月流量筛选只使用周期明确且无冲突的数字。</p>
          </div>

          <div class="finder-controls" @change="changeFilters">
            <div class="finder-fields">
              <label class="finder-field">
                <span>使用设备</span>
                <select v-model="device">
                  <option v-for="item in devices" :key="item.id" :value="item.id">{{ item.label }}</option>
                </select>
              </label>
              <label class="finder-field">
                <span>月付预算上限</span>
                <select v-model="budget">
                  <option :value="null">不限预算</option>
                  <option v-for="amount in [5, 10, 15, 20, 30, 50, 100]" :key="amount" :value="amount">{{ amount }} 元 / 月</option>
                </select>
              </label>
              <label class="finder-field">
                <span>每月最低流量</span>
                <select v-model="minDataGB">
                  <option :value="0">不限流量门槛</option>
                  <option v-for="amount in [50, 100, 200, 300, 500, 1000]" :key="amount" :value="amount">{{ formatData(amount) }} GB / 月</option>
                </select>
              </label>
            </div>
            <div class="finder-tutorial">
              <span class="finder-tutorial__label">该设备的使用教程</span>
              <a :href="selectedDevice.path" target="_blank" rel="noopener noreferrer">{{ selectedDevice.tutorial }}</a>
              <p>设备选项只切换教程入口，不筛选兼容性；订阅格式与协议支持请在评测和购买前确认。已有订阅可以直接按教程导入。</p>
            </div>
          </div>

          <div class="finder-result-tools" @change="changeFilters">
            <label class="finder-search">
              <span class="finder-sr-only">搜索机场或套餐名称</span>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
              <input v-model="query" type="search" placeholder="搜索机场或套餐名称" @input="changeFilters">
            </label>
            <label class="finder-sort">
              <span class="finder-sr-only">结果排序</span>
              <select v-model="sort">
                <option value="recommended">推荐优先</option>
                <option value="price">月付价格从低到高</option>
                <option value="data">月流量从高到低</option>
              </select>
            </label>
            <button type="button" class="finder-button" @click="resetFilters">重置筛选</button>
          </div>
        </div>

        <section class="finder-selection" aria-label="已选对比套餐">
          <div class="finder-selection__top">
            <p class="finder-result-count" role="status" aria-live="polite">
              <template v-if="!showingComparison">
                <strong>{{ displayPlans.length }}</strong> 家{{ unverifiedCount ? '展示' : '符合条件' }}
                <span v-if="unverifiedCount" class="finder-pending-count">（{{ unverifiedCount }} 家保留原文口径）</span>
                <span class="finder-dot">·</span>
              </template>
              已选 <strong>{{ selectedPlans.length }} / 3</strong> 家
            </p>
            <div class="finder-selection__actions">
              <button v-if="!showingComparison" type="button" class="finder-button finder-button--primary" :disabled="selectedPlans.length < 2" @click="showComparison">
                对比已选（{{ selectedPlans.length }}）
              </button>
              <button v-else type="button" class="finder-button" @click="showFilters">← 返回筛选</button>
              <button v-if="selectedPlans.length" type="button" class="finder-button finder-button--text" @click="clearSelection">清空对比</button>
            </div>
          </div>
          <div v-if="selectedPlans.length" class="finder-selected-chips">
            <button v-for="plan in selectedPlans" :key="plan.id" type="button" class="finder-chip" :aria-label="`移除${plan.airportName}的${plan.name}`" @click="removeSelection(plan.id)">
              <span>{{ plan.airportName }} · {{ plan.name }}</span><span aria-hidden="true">×</span>
            </button>
          </div>
          <p :id="selectionStatusId" ref="selectionMessage" class="finder-help" tabindex="-1" role="status" aria-live="polite">{{ selectionStatus }}</p>
        </section>

        <template v-if="!showingComparison">
          <div v-if="displayPlans.length" class="finder-results">
            <article v-for="plan in displayPlans" :key="plan.id" class="finder-card" :class="{ 'is-selected': isSelected(plan), 'is-recommended': isRecommended(plan) }">
              <div class="finder-card__top">
                <h4>{{ plan.airportName }}</h4>
                <div class="finder-card__badges">
                  <span v-if="isRecommended(plan)" class="finder-recommend-badge" aria-label="编辑推荐">
                    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="m10 1.8 2.5 5.1 5.7.8-4.1 4 .9 5.6-5-2.6-5 2.6.9-5.6-4.1-4 5.7-.8Z" /></svg>
                    推荐
                  </span>
                  <span v-if="isSelected(plan)" class="finder-badge">已选</span>
                  <span v-if="plan.riskLabel" class="finder-risk-badge" :class="{ 'finder-risk-badge--info': plan.riskTone === 'info' }">{{ plan.riskLabel }}</span>
                </div>
              </div>
              <p v-if="plan.monthlyPrice !== null" class="finder-card__price"><span>¥{{ formatMoney(plan.monthlyPrice) }}</span><small>/ 月</small></p>
              <p v-else class="finder-card__price finder-card__price--pending"><span>{{ formatMonthlyPrice(plan) }}</span></p>
              <p class="finder-card__data" :class="{ 'finder-card__data--pending': plan.monthlyDataGB === null }">{{ formatMonthlyData(plan) }}<span>{{ plan.monthlyDataGB === null ? '保留原文流量与周期' : '套餐标注流量' }}</span></p>
              <p class="finder-card__plan">{{ plan.name }}</p>
              <p v-if="plan.priceDescription" class="finder-card__summary">原文入门摘要：{{ plan.priceDescription }}</p>
              <dl class="finder-card__details">
                <div><dt>设备限制</dt><dd>{{ plan.deviceLimit }}</dd></div>
              </dl>
              <p class="finder-card__note">{{ plan.note }}</p>
              <p v-if="plan.riskPath" class="finder-card__status"><a :href="plan.riskPath" target="_blank" rel="noopener noreferrer">查看服务状态与公告</a></p>
              <p class="finder-source">{{ sourceDateLabel(plan) }} {{ plan.sourceDate }}；现价待购买前核对</p>
              <p v-if="plan.officialUrl" class="finder-card__official"><a :href="plan.officialUrl" target="_blank" rel="sponsored nofollow noopener noreferrer">官网购买</a></p>
              <div class="finder-card__footer">
                <a :href="plan.sourcePath" target="_blank" rel="noopener noreferrer">查看套餐与风险</a>
                <label class="finder-check" :class="{ 'is-disabled': cannotSelect(plan) }">
                  <input type="checkbox" :checked="isSelected(plan)" :disabled="cannotSelect(plan)" :aria-describedby="selectionStatusId" :aria-label="`${isSelected(plan) ? '移除' : '选择'}${plan.airportName}的${plan.name}进行对比`" @change="toggleSelection(plan, $event)">
                  <span>{{ isSelected(plan) ? '已选对比' : selectedAirports.has(plan.airportId) ? '更换对比档位' : '加入对比' }}</span>
                </label>
              </div>
            </article>
          </div>
          <div v-else class="finder-empty" role="status">
            <svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4M8 10.5h5" /></svg>
            <h4>暂时没有符合条件的套餐</h4>
            <p>可以提高预算、降低流量门槛，或清除搜索词。资料不明确的机场不会被当作满足数字条件；重置后可查看并对比全量目录。</p>
            <button type="button" class="finder-button" @click="resetFilters">恢复默认筛选</button>
          </div>
        </template>

        <section v-else class="finder-comparison" aria-label="套餐横向对比">
          <h3 ref="compareHeading" tabindex="-1">对比已选套餐</h3>
          <p class="finder-help">对比保留所选档位，价格与流量按原文周期显示；不同标价会并列注明。只有明确月费与月度流量才计算每 GB 费用，不计节点倍率、额外开销或折扣。</p>
          <div class="finder-table-scroll" role="region" aria-label="可横向滚动的机场套餐对比表" tabindex="0">
            <table class="finder-table">
              <thead>
                <tr>
                  <th scope="col">对比项目</th>
                  <th v-for="plan in selectedPlans" :key="plan.id" scope="col">
                    <strong>{{ plan.airportName }}</strong><span>{{ plan.name }}</span>
                    <button type="button" class="finder-remove" :aria-label="`从对比中移除${plan.airportName}`" @click="removeSelection(plan.id)">移除</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row">套餐价格</th><td v-for="plan in selectedPlans" :key="plan.id" class="finder-table__price">{{ formatMonthlyPrice(plan) }}</td></tr>
                <tr><th scope="row">套餐流量</th><td v-for="plan in selectedPlans" :key="plan.id">{{ formatMonthlyData(plan) }}</td></tr>
                <tr><th scope="row">官网</th><td v-for="plan in selectedPlans" :key="plan.id"><a v-if="plan.officialUrl" class="finder-buy" :href="plan.officialUrl" target="_blank" rel="sponsored nofollow noopener noreferrer" :aria-label="`前往${plan.airportName}官网购买`">购买</a><span v-else>原文未提供官网</span></td></tr>
                <tr><th scope="row">名义流量单价</th><td v-for="plan in selectedPlans" :key="plan.id">{{ formatUnitPrice(plan) }}</td></tr>
                <tr><th scope="row">原文入门摘要</th><td v-for="plan in selectedPlans" :key="plan.id">{{ plan.priceDescription || '详见原文套餐表' }}<small>保留原口径，可能是另一档套餐，不自动折算月付</small></td></tr>
                <tr><th scope="row">设备限制</th><td v-for="plan in selectedPlans" :key="plan.id">{{ plan.deviceLimit }}</td></tr>
                <tr><th scope="row">服务状态</th><td v-for="plan in selectedPlans" :key="plan.id">{{ plan.riskLabel || '未单独标注，请核对当前公告' }}<small v-if="plan.riskPath"><a :href="plan.riskPath" target="_blank" rel="noopener noreferrer">查看状态来源</a></small></td></tr>
                <tr><th scope="row">注意事项</th><td v-for="plan in selectedPlans" :key="plan.id">{{ plan.note }}</td></tr>
                <tr><th scope="row">来源日期</th><td v-for="plan in selectedPlans" :key="plan.id">{{ plan.sourceDate }}<small>{{ sourceDateLabel(plan) }}，不是本次核价日期</small></td></tr>
                <tr><th scope="row">继续核对</th><td v-for="plan in selectedPlans" :key="plan.id"><a :href="plan.sourcePath" target="_blank" rel="noopener noreferrer">查看评测与套餐</a></td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <footer class="finder-footnotes">
          <p>目录依据本站机场评测整理，价格与流量保留原文周期和不同口径；资料整理于 {{ catalogUpdated }}，不是实时询价。“购买”链接前往主文章登记的对应官网，部分链接含推广参数，详见广告披露。付款前请核对价格、流量重置、倍率、兼容与退款条件。</p>
          <details>
            <summary>收录口径与待核对资料</summary>
            <p>全量目录中的每家机场均可按名称查找、查看原文并加入对比。预算筛选只使用明确月付金额，流量筛选只使用明确月度 GB；年付折合、一次性、优惠码或冲突资料保留原文摘要，不自行换算。价格和流量排序会把对应未知数字放在最后，每家只展示一张匹配卡片。</p>
            <ul v-if="catalogDataNotes.length">
              <li v-for="item in catalogDataNotes" :key="item.sourcePath"><a :href="item.sourcePath" target="_blank" rel="noopener noreferrer">{{ item.airportName }}</a>：{{ item.reason }}</li>
            </ul>
            <p>能加入对比不表示推荐或仍在正常运营；有风险或恢复记录的条目保留状态来源。测试依据见<a href="/methodology/" target="_blank" rel="noopener noreferrer">评测方法</a>，推广关系见<a href="/disclosure/" target="_blank" rel="noopener noreferrer">广告披露</a>。</p>
          </details>
        </footer>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.airport-finder {
  --finder-bg: var(--vp-c-bg, #fff);
  --finder-soft: var(--vp-c-bg-alt, #f6f7f9);
  --finder-text: var(--vp-c-text-1, #202938);
  --finder-muted: var(--vp-c-text-2, #5c6574);
  --finder-border: var(--vp-c-divider, #e1e5eb);
  --finder-brand: var(--vp-c-brand-1, #3759d7);
  --finder-recommend: #94500b;
  --finder-recommend-border: #dba74d;
  --finder-recommend-soft: rgb(245 158 11 / 9%);
  --finder-risk-text: #b91c1c;
  margin: 24px 0;
  scroll-margin-top: 88px;
  color: var(--finder-text);
}
:global([data-theme="dark"] .airport-finder) {
  --finder-recommend: #fbbf24;
  --finder-recommend-border: #b88426;
  --finder-recommend-soft: rgb(245 158 11 / 10%);
  --finder-risk-text: #fca5a5;
}
.airport-finder *, .airport-finder *::before, .airport-finder *::after { box-sizing: border-box; }
.airport-finder h2, .airport-finder h3, .airport-finder h4 { margin: 0; padding: 0; border: 0; color: var(--finder-text); line-height: 1.5; }
.airport-finder h2 { font-size: 21px; }
.airport-finder h3 { font-size: 20px; }
.airport-finder h4 { font-size: 17px; }
.airport-finder p { margin: 0; }
.airport-finder a { color: var(--finder-brand); text-decoration: none; font-weight: 500; }
.airport-finder a:hover { text-decoration: underline; }
.airport-finder button, .airport-finder input, .airport-finder select { font: inherit; }
.airport-finder button { cursor: pointer; }
.airport-finder button:disabled { cursor: not-allowed; opacity: .45; }
.airport-finder :is(button, a, input, select, summary, [tabindex]):focus-visible { outline: 3px solid var(--finder-brand); outline-offset: 3px; }
.finder-launch { display: flex; align-items: center; gap: 18px; padding: 22px; border: 1px solid var(--finder-border); border-radius: 14px; background: var(--finder-soft); }
.finder-launch__icon { display: grid; flex: 0 0 48px; width: 48px; height: 48px; place-items: center; border: 1px solid var(--finder-border); border-radius: 13px; color: var(--finder-brand); background: var(--finder-bg); }
.finder-launch__copy { flex: 1; }
.finder-launch__copy h2 { font-size: 18px; }
.finder-launch__copy p { margin-top: 5px; font-size: 14px; line-height: 1.7; color: var(--finder-muted); }
.finder-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; padding: 8px 13px; border: 1px solid var(--finder-border); border-radius: 8px; background: var(--finder-bg); color: var(--finder-text); font-size: 14px !important; line-height: 1.5; white-space: nowrap; transition: border-color .15s, background-color .15s; }
.finder-button:hover:not(:disabled) { border-color: var(--finder-brand); }
.finder-button--primary { border-color: var(--finder-brand); background: var(--finder-brand); color: var(--finder-bg); font-weight: 600 !important; }
.finder-button--primary:hover:not(:disabled) { filter: brightness(1.07); }
.finder-button--text { border-color: transparent; background: transparent; color: var(--finder-muted); }
.finder-launch__button { flex: 0 0 auto; }
.airport-finder--home { margin: 0; padding: 0 48px 16px; }
.finder-home-launch { display: flex; align-items: center; justify-content: space-between; gap: 32px; max-width: 1152px; margin: 0 auto; padding: 30px 34px; border: 1px solid var(--finder-brand); border-radius: 20px; background: radial-gradient(ellipse at top right, rgb(99 102 241 / 13%), transparent 62%), linear-gradient(110deg, rgb(37 99 235 / 8%), transparent 80%), var(--finder-bg); box-shadow: 0 12px 34px rgb(37 99 235 / 10%); }
.finder-home-launch__main { display: flex; align-items: flex-start; gap: 20px; min-width: 0; }
.finder-home-launch__icon { display: grid; flex: 0 0 58px; width: 58px; height: 58px; margin-top: 5px; place-items: center; border-radius: 16px; color: #fff; background: linear-gradient(135deg, #2563eb, #4338ca); box-shadow: 0 7px 18px rgb(37 99 235 / 18%); }
.finder-home-launch__copy { min-width: 0; }
.finder-home-launch__eyebrow { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; color: var(--finder-muted); font-size: 12px; line-height: 1.7; }
.finder-home-launch__eyebrow > span { padding: 2px 8px; border-radius: 5px; background: var(--finder-brand); color: var(--finder-bg); font-weight: 700; }
.airport-finder--home .finder-home-launch h2 { margin-top: 9px; font-size: clamp(24px, 2.3vw, 32px); font-weight: 800; letter-spacing: -.02em; }
.finder-home-launch__description { margin-top: 8px !important; color: var(--finder-muted); font-size: 15px; line-height: 1.8; }
.finder-home-launch__features { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px; }
.finder-home-launch__features > span { padding: 3px 9px; border: 1px solid var(--finder-border); border-radius: 6px; background: var(--finder-bg); color: var(--finder-muted); font-size: 12px; line-height: 1.7; }
.finder-home-launch__actions { display: flex; flex: 0 0 auto; flex-direction: column; align-items: center; gap: 12px; }
.finder-home-launch__actions .finder-home-launch__button { min-width: 194px; min-height: 50px; margin: 0; padding: 12px 23px; border: 0; border-radius: 10px; background: linear-gradient(115deg, #2563eb, #4338ca); color: #fff; font-size: 16px !important; font-weight: 700; box-shadow: 0 6px 18px rgb(37 99 235 / 20%); }
.finder-home-launch__button:hover { filter: brightness(1.08); }
.finder-home-launch__actions > a { font-size: 13px; line-height: 1.8; }
.finder-dialog { position: fixed; inset: 0; display: flex; flex-direction: column; width: 1080px; max-width: calc(100vw - 40px); height: min(860px, calc(100dvh - 40px)); max-height: calc(100dvh - 40px); margin: auto; padding: 0; border: 1px solid var(--finder-border); border-radius: 16px; background: var(--finder-bg); color: var(--finder-text); overflow: hidden; box-shadow: 0 24px 90px rgb(0 0 0 / 20%); }
.finder-dialog:not([open]) { display: none; }
.finder-dialog::backdrop { background: rgb(15 23 42 / 48%); }
.finder-dialog__header { flex: 0 0 auto; padding: 20px 24px 0; border-bottom: 1px solid var(--finder-border); background: var(--finder-bg); }
.finder-dialog__heading-row { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.finder-eyebrow { margin-bottom: 3px !important; font-size: 12px; letter-spacing: .05em; color: var(--finder-muted); }
.finder-close { min-height: 36px; }
.finder-tabs { display: flex; gap: 24px; margin-top: 16px; }
.finder-tabs > button { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 0 12px; border: 0; border-bottom: 3px solid transparent; background: transparent; color: var(--finder-muted); font-size: 14px; }
.finder-tabs > button.is-active { border-bottom-color: var(--finder-brand); color: var(--finder-brand); font-weight: 600; }
.finder-count { padding: 1px 6px; border-radius: 5px; background: var(--finder-soft); font-size: 12px; }
.finder-dialog__body { flex: 1 1 auto; min-height: 0; padding: 25px; overflow-y: auto; overscroll-behavior: contain; }
.finder-intro > p { margin-top: 7px; font-size: 14px; line-height: 1.8; color: var(--finder-muted); }
.finder-controls { margin-top: 19px; padding: 19px; border: 1px solid var(--finder-border); border-radius: 12px; background: var(--finder-soft); }
.finder-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.finder-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.finder-field > span { font-size: 14px; font-weight: 600; }
.finder-field select, .finder-sort select, .finder-search input { width: 100%; min-height: 44px; padding: 9px 12px; border: 1px solid var(--finder-border); border-radius: 8px; background: var(--finder-bg); color: var(--finder-text); font-size: 16px; line-height: 1.4; }
.finder-tutorial { margin-top: 16px; padding-top: 15px; border-top: 1px solid var(--finder-border); font-size: 14px; line-height: 1.8; }
.finder-tutorial__label { margin-right: 12px; color: var(--finder-muted); }
.finder-tutorial p { margin-top: 5px; font-size: 12px; color: var(--finder-muted); }
.finder-result-tools { display: flex; gap: 10px; margin-top: 18px; }
.finder-search { position: relative; flex: 1; min-width: 0; }
.finder-search svg { position: absolute; left: 12px; top: 13px; color: var(--finder-muted); pointer-events: none; }
.finder-search input { padding-left: 37px; }
.finder-sort { width: 205px; flex: 0 0 auto; }
.finder-sort select { font-size: 14px; }
.finder-selection { margin: 20px 0 18px; }
.finder-selection__top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.finder-result-count { font-size: 14px; }
.finder-result-count strong { color: var(--finder-brand); font-size: 17px; }
.finder-pending-count { color: var(--finder-muted); font-size: 12px; }
.finder-dot { margin: 0 10px; color: var(--finder-muted); }
.finder-selection__actions { display: flex; gap: 6px; }
.finder-selected-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.finder-chip { display: inline-flex; align-items: center; gap: 12px; max-width: 100%; padding: 6px 10px; border: 1px solid var(--finder-border); border-radius: 7px; color: var(--finder-text); background: var(--finder-soft); font-size: 12px !important; line-height: 1.5; }
.finder-chip > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.finder-chip > span:last-child { color: var(--finder-muted); font-size: 18px; line-height: 1; }
.finder-help { margin-top: 9px !important; color: var(--finder-muted); font-size: 12px; line-height: 1.8; }
.finder-results { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.finder-card { display: flex; flex-direction: column; min-width: 0; padding: 18px; border: 1px solid var(--finder-border); border-radius: 11px; background: var(--finder-bg); transition: border-color .15s, box-shadow .15s; }
.finder-card.is-recommended { border-color: var(--finder-recommend-border); background: linear-gradient(155deg, var(--finder-recommend-soft), transparent 60%), var(--finder-bg); box-shadow: inset 0 3px 0 var(--finder-recommend-border); }
.finder-card.is-recommended:hover { box-shadow: inset 0 3px 0 var(--finder-recommend-border), 0 6px 18px var(--finder-recommend-soft); }
.finder-card.is-selected { border-color: var(--finder-brand); box-shadow: inset 0 0 0 1px var(--finder-brand); }
.finder-card__top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.finder-card__badges { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 5px; }
.finder-recommend-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border: 1px solid var(--finder-recommend-border); border-radius: 5px; color: var(--finder-recommend); background: var(--finder-recommend-soft); font-size: 11px; font-weight: 600; white-space: nowrap; }
.finder-risk-badge { padding: 2px 6px; border-radius: 4px; color: var(--finder-risk-text); background: rgb(239 68 68 / 10%); font-size: 11px; white-space: nowrap; }
.finder-risk-badge--info { color: var(--finder-brand); background: var(--finder-soft); }
.finder-badge { padding: 1px 6px; border-radius: 4px; color: var(--finder-brand); background: var(--finder-soft); font-size: 11px; white-space: nowrap; }
.finder-card__price { display: flex; align-items: baseline; gap: 4px; margin-top: 12px !important; }
.finder-card__price > span { color: var(--finder-brand); font-size: 27px; font-weight: 700; line-height: 1.25; }
.finder-card__price--pending > span { color: var(--finder-muted); font-size: 20px; }
.finder-card__price small { font-size: 12px; color: var(--finder-muted); }
.finder-card__data { margin-top: 5px !important; font-size: 16px; font-weight: 600; }
.finder-card__data--pending { color: var(--finder-muted); font-size: 14px; }
.finder-card__data > span { display: block; margin-top: 1px; color: var(--finder-muted); font-size: 11px; font-weight: 400; }
.finder-card__plan { margin-top: 13px !important; font-size: 13px; line-height: 1.6; }
.finder-card__summary { margin-top: 7px !important; color: var(--finder-muted); font-size: 12px; line-height: 1.8; }
.finder-card__status { margin-top: 8px !important; font-size: 12px; }
.finder-card__details { margin: 9px 0 0; font-size: 12px; line-height: 1.7; }
.finder-card__details > div { display: flex; gap: 8px; }
.finder-card__details dt { color: var(--finder-muted); white-space: nowrap; }
.finder-card__details dd { margin: 0; }
.finder-card__note { flex: 1; margin-top: 9px !important; color: var(--finder-muted); font-size: 12px; line-height: 1.8; }
.finder-source { margin-top: 13px !important; color: var(--finder-muted); font-size: 11px; line-height: 1.8; }
.finder-card__official { margin-top: 10px !important; font-size: 13px; font-weight: 600; }
.airport-finder .finder-buy { display: inline-flex; align-items: center; gap: 5px; padding: 5px 15px; border-radius: 6px; background: var(--finder-brand); color: var(--finder-bg); font-weight: 600; text-decoration: none; }
.airport-finder .finder-buy:hover { opacity: .85; }
.airport-finder .finder-buy:focus-visible { outline: 2px solid var(--finder-brand); outline-offset: 3px; }
.finder-card__footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 13px; padding-top: 12px; border-top: 1px solid var(--finder-border); font-size: 12px; }
.finder-check { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.finder-check input { width: 16px; height: 16px; margin: 0; accent-color: var(--finder-brand); cursor: inherit; }
.finder-check.is-disabled { color: var(--finder-muted); cursor: not-allowed; opacity: .6; }
.finder-empty { padding: 34px 22px; border: 1px dashed var(--finder-border); border-radius: 12px; text-align: center; color: var(--finder-muted); }
.finder-empty h4 { margin-top: 10px; }
.finder-empty p { max-width: 440px; margin: 7px auto 16px; font-size: 13px; line-height: 1.8; }
.finder-comparison > h3 { margin-top: 22px; }
.finder-table-scroll { width: 100%; margin-top: 15px; overflow-x: auto; border: 1px solid var(--finder-border); border-radius: 10px; }
.airport-finder .finder-table { display: table; width: 100%; min-width: 660px; margin: 0; border-collapse: collapse; table-layout: fixed; font-size: 13px; line-height: 1.8; }
.airport-finder .finder-table :is(th, td) { min-width: 0; padding: 14px; border: 0; border-right: 1px solid var(--finder-border); border-bottom: 1px solid var(--finder-border); text-align: left; vertical-align: top; overflow-wrap: anywhere; background: transparent; }
.airport-finder .finder-table tr > :last-child { border-right: 0; }
.airport-finder .finder-table tbody tr:last-child > * { border-bottom: 0; }
.airport-finder .finder-table thead th { background: var(--finder-soft); }
.airport-finder .finder-table tr > :first-child { width: 125px; color: var(--finder-muted); font-weight: 500; }
.finder-table thead th strong { display: block; font-size: 16px; }
.finder-table thead th > span { display: block; margin-top: 4px; color: var(--finder-muted); font-size: 12px; font-weight: 400; }
.finder-remove { margin-top: 8px; padding: 0; border: 0; color: var(--finder-muted); background: transparent; font-size: 12px !important; text-decoration: underline; text-underline-offset: 3px; }
.finder-table__price { color: var(--finder-brand); font-size: 16px; font-weight: 600; }
.finder-table td small { display: block; color: var(--finder-muted); font-size: 11px; }
.finder-footnotes { margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--finder-border); color: var(--finder-muted); font-size: 12px; line-height: 1.9; }
.finder-footnotes details { margin-top: 10px; }
.finder-footnotes summary { cursor: pointer; font-weight: 600; color: var(--finder-text); }
.finder-footnotes details p { margin-top: 8px; }
.finder-footnotes ul { margin: 8px 0; padding-left: 20px; }
.finder-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 900px) {
  .finder-home-launch { align-items: flex-start; gap: 24px; padding: 26px; }
  .finder-home-launch__main { gap: 14px; }
  .finder-home-launch__icon { flex-basis: 48px; width: 48px; height: 48px; border-radius: 13px; }
  .finder-home-launch__actions .finder-home-launch__button { min-width: 166px; padding: 12px 16px; }
  .finder-launch { flex-wrap: wrap; }
  .finder-launch__copy { flex-basis: calc(100% - 70px); }
  .finder-launch__button { margin-left: 66px; }
  .finder-results { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .finder-home-launch { flex-direction: column; gap: 23px; }
  .finder-home-launch__actions { flex-direction: row; flex-wrap: wrap; justify-content: space-between; width: 100%; }
}
@media (max-width: 600px) {
  .airport-finder--home { padding: 0 24px 8px; }
  .finder-home-launch { gap: 20px; padding: 23px 20px; border-radius: 16px; }
  .finder-home-launch__main { flex-direction: column; gap: 14px; }
  .finder-home-launch__icon { margin: 0; }
  .finder-home-launch__eyebrow { font-size: 11px; }
  .airport-finder--home .finder-home-launch h2 { font-size: 25px; }
  .finder-home-launch__description { font-size: 14px; }
  .finder-home-launch__features { gap: 6px; margin-top: 12px; }
  .finder-home-launch__features > span { padding: 3px 7px; font-size: 11px; }
  .finder-home-launch__actions { flex-direction: column; align-items: stretch; gap: 11px; text-align: center; }
  .finder-home-launch__actions .finder-home-launch__button { width: 100%; min-height: 48px; }
  .finder-launch { gap: 12px; padding: 17px; }
  .finder-launch__icon { flex-basis: 40px; width: 40px; height: 40px; border-radius: 10px; }
  .finder-launch__copy { flex-basis: calc(100% - 52px); }
  .finder-launch__copy h2 { font-size: 17px; }
  .finder-launch__button { width: 100%; margin-left: 0; }
  .finder-dialog { max-width: calc(100vw - 16px); height: calc(100dvh - 16px); max-height: calc(100dvh - 16px); border-radius: 12px; }
  .finder-dialog__header { padding: 16px 16px 0; }
  .finder-dialog__body { padding: 18px 16px; }
  .finder-dialog h2 { font-size: 19px; }
  .finder-dialog h3 { font-size: 18px; }
  .finder-close { gap: 5px; padding: 7px 9px; }
  .finder-tabs { gap: 20px; margin-top: 12px; }
  .finder-fields { grid-template-columns: 1fr; gap: 13px; }
  .finder-controls { padding: 15px; }
  .finder-tutorial__label { display: block; }
  .finder-result-tools { flex-wrap: wrap; }
  .finder-search { flex-basis: 100%; }
  .finder-sort { flex: 1; width: auto; }
  .finder-selection__top { gap: 10px; }
  .finder-selection__actions { flex-wrap: wrap; }
  .finder-results { grid-template-columns: 1fr; }
  .finder-card { padding: 18px; }
  .finder-card__data > span { display: inline; margin-left: 10px; }
}
</style>
