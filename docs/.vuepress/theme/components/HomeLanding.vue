<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { homeFaqItems } from '../data/homeContent'
import AirportPlanFinder from './AirportPlanFinder.vue'
import AirportSpeedTest from './AirportSpeedTest.vue'

const route = useRoute()
const router = useRouter()
const nodeTool = ref<HTMLDetailsElement | null>(null)

const revealLinkedTool = async (): Promise<void> => {
  if (route.hash !== '#airport-node-test' || !nodeTool.value)
    return
  nodeTool.value.open = true
  await nextTick()
  nodeTool.value?.scrollIntoView({ block: 'start' })
}

onMounted(revealLinkedTool)
const removeNavigationHook = router.afterEach(revealLinkedTool)
onUnmounted(removeNavigationHook)

const tutorials = [
  { title: 'Windows / Mac', subtitle: 'Clash Verge', description: '安装客户端，导入订阅，开启系统代理。', icon: 'desktop', tone: 'blue', link: '/article/ClashVerge/' },
  { title: 'iPhone / iPad', subtitle: 'Shadowrocket 小火箭', description: '从下载到配置，一步步完成首次连接。', icon: 'phone', tone: 'violet', link: '/article/Shadowrocket/' },
  { title: 'Android', subtitle: 'Clash for Android', description: '订阅导入、规则分流与常见问题排查。', icon: 'android', tone: 'teal', link: '/article/ClashforAndroid/' },
]

const moreGuides = [
  { title: '新手入门', link: '/article/2026fanqiangzhinan/' },
  { title: 'AI 工具访问', link: '/article/ai-search-agent-access-guide-2026/' },
  { title: '路由器配置', link: '/article/luyouqi/' },
  { title: '连接故障排查', link: '/vpn-speed-test/' },
]

const updates = [
  { date: '2026-11-08', label: '11.08', category: '故障排查', title: '手机锁屏断连、切网与耗电，怎么排查？', link: '/article/mobile-vpn-airport-disconnect-battery-guide-2026/' },
  { date: '2026-11-07', label: '11.07', category: '网络测试', title: '电信、联通、移动，如何选适合自己的机场？', link: '/article/vpn-airport-telecom-unicom-mobile-guide-2026/' },
  { date: '2026-11-06', label: '11.06', category: '使用指南', title: '远程办公：视频会议与文件上传测试指南', link: '/article/vpn-airport-remote-work-meeting-guide-2026/' },
]
</script>

<template>
  <div class="home-landing">
    <section class="home-intro" aria-labelledby="home-title">
      <p class="home-eyebrow"><span aria-hidden="true" /> VPN 机场评测与使用指南</p>
      <h1 id="home-title"><span>选对机场，</span>轻松连接。</h1>
      <p class="home-intro__description">机场怎么选，客户端怎么用。<br>从套餐对比到连接排查，在这里找到答案。</p>
      <div class="home-intro__actions">
        <a class="home-primary-action" href="/vpn-recommend/">查看机场推荐 <span aria-hidden="true">↗</span></a>
        <AirportPlanFinder variant="compact" />
      </div>
      <nav class="home-shortcuts" aria-label="机场选购快捷入口">
        <a href="/article/mianfeijichang/">免费试用</a>
        <span aria-hidden="true">/</span>
        <a href="/airport/jichangpk/">性能与价格对比</a>
        <span aria-hidden="true">/</span>
        <a href="/scamvpn/paolujichang/">跑路预警</a>
      </nav>
    </section>

    <section class="home-section" aria-labelledby="home-guides-title">
      <header class="home-section__heading">
        <div><p class="home-section__label">快速上手</p><h2 id="home-guides-title">选好设备，开始连接</h2></div>
        <a class="home-text-link" href="/topics/">全部教程 <span aria-hidden="true">↗</span></a>
      </header>
      <div class="home-device-grid">
        <a v-for="tutorial in tutorials" :key="tutorial.link" class="home-device" :data-tone="tutorial.tone" :href="tutorial.link">
          <span class="home-device__icon" aria-hidden="true">
            <svg v-if="tutorial.icon === 'desktop'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 21h8m-4-5v5" /></svg>
            <svg v-else-if="tutorial.icon === 'phone'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 5h4m-3 14h2" /></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7 3 1.5 2M17 3l-1.5 2M5 11a7 7 0 0 1 14 0Zm0 0v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7M8 19v3m8-3v3M2 12v5m20-5v5" /><path d="M9 8h.01M15 8h.01" /></svg>
          </span>
          <span class="home-device__arrow" aria-hidden="true">↗</span>
          <h3>{{ tutorial.title }}</h3>
          <p class="home-device__subtitle">{{ tutorial.subtitle }}</p>
          <p class="home-device__description">{{ tutorial.description }}</p>
        </a>
      </div>
      <nav class="home-more-guides" aria-label="更多使用教程">
        <span>你可能还需要</span>
        <a v-for="guide in moreGuides" :key="guide.link" :href="guide.link">{{ guide.title }} <span aria-hidden="true">↗</span></a>
      </nav>
    </section>

    <section class="home-section home-tools" aria-label="实用工具">
      <details id="airport-node-test" ref="nodeTool" class="home-node-tool">
        <summary>
          <span class="home-tool-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18a9 9 0 1 1 16 0M12 4v2M5 9l1.5 1M19 9l-1.5 1M12 14l4-5" /><circle cx="12" cy="15" r="2" /></svg></span>
          <span class="home-tool-copy"><strong>订阅节点检测</strong><span>已有订阅？检查节点是否可达，以及 TCP 握手延迟。</span></span>
          <span class="home-tool-toggle">打开工具 <span aria-hidden="true">+</span></span>
        </summary>
        <div class="home-node-tool__body"><AirportSpeedTest embedded /></div>
      </details>
    </section>

    <section class="home-section home-updates" aria-labelledby="home-updates-title">
      <header class="home-section__heading">
        <div><p class="home-section__label">持续更新</p><h2 id="home-updates-title">最近值得看</h2></div>
        <a class="home-text-link" href="/blog/">所有文章 <span aria-hidden="true">↗</span></a>
      </header>
      <div class="home-update-list">
        <a v-for="update in updates" :key="update.link" class="home-update" :href="update.link">
          <time :datetime="update.date">{{ update.label }}</time>
          <span class="home-update__category">{{ update.category }}</span>
          <h3>{{ update.title }}</h3>
          <span class="home-update__arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </section>

    <section class="home-section home-questions" aria-labelledby="home-faq-title">
      <header class="home-section__heading"><div><p class="home-section__label">少走弯路</p><h2 id="home-faq-title">常见问题</h2></div></header>
      <div class="home-question-list">
        <details v-for="item in homeFaqItems" :key="item.question">
          <summary>{{ item.question }}<span aria-hidden="true">+</span></summary>
          <div class="home-question-answer"><p>{{ item.answer }}</p><a :href="item.link">{{ item.linkText }} <span aria-hidden="true">↗</span></a></div>
        </details>
      </div>
    </section>

    <aside class="home-note" aria-label="关于本站评测">
      <p>先了解，再选择。</p>
      <span>查看 <a href="/methodology/">评测方法</a> 与 <a href="/disclosure/">推广披露</a>，让每一次选择都有依据。</span>
    </aside>
  </div>
</template>

<style scoped>
.home-landing {
  --home-muted: var(--vp-c-text-2);
  --home-border: var(--vp-c-divider);
  box-sizing: border-box;
  max-width: 1104px;
  padding: 0 32px;
  margin: 0 auto;
  color: var(--vp-c-text-1);
}
.home-landing :where(a, button, summary):focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 5px; }
.home-landing a { text-decoration: none; }
.home-intro { padding: 86px 0 64px; background: radial-gradient(ellipse at 50% 0, var(--site-recommend-soft), transparent 65%); text-align: center; }
.home-eyebrow { display: flex; gap: 9px; align-items: center; justify-content: center; width: fit-content; padding: 7px 12px; margin: 0 auto 24px; border: 1px solid var(--site-recommend-border); border-radius: 999px; background: var(--site-recommend-soft); color: var(--site-recommend); font-size: 12px; font-weight: 500; letter-spacing: 1px; }
.home-eyebrow > span { width: 6px; height: 6px; border-radius: 50%; background: var(--site-recommend-solid); }
.home-intro h1 { margin: 0; font-size: clamp(36px, 5vw, 58px); font-weight: 750; line-height: 1.25; letter-spacing: -2px; text-wrap: balance; }
.home-intro h1 > span { color: var(--site-recommend); }
.home-intro__description { margin: 24px 0 28px; color: var(--home-muted); font-size: 16px; line-height: 1.9; }
.home-intro__actions { display: flex; gap: 12px; align-items: center; justify-content: center; }
.home-primary-action { display: inline-flex; gap: 22px; align-items: center; justify-content: center; min-height: 46px; padding: 0 22px; border: 1px solid var(--site-recommend-solid); border-radius: 10px; background: var(--site-recommend-solid); box-shadow: 0 5px 16px var(--site-recommend-shadow); color: var(--site-recommend-ink); font-size: 14px; font-weight: 600; transition: background-color .2s, border-color .2s; }
.home-primary-action:hover { border-color: var(--site-recommend-hover); background: var(--site-recommend-hover); }
.home-primary-action:focus-visible { outline-color: var(--site-recommend); }
.home-primary-action > span { font-size: 18px; }
.home-shortcuts { display: flex; gap: 15px; justify-content: center; margin-top: 24px; color: var(--vp-c-text-3); font-size: 12px; }
.home-shortcuts a { color: var(--site-recommend); }
.home-shortcuts a:hover, .home-text-link:hover, .home-more-guides a:hover, .home-note a:hover { color: var(--vp-c-brand-1); }
.home-shortcuts a:hover { color: var(--site-recommend-hover); }
.home-section { margin-bottom: 46px; }
.home-section__heading { display: flex; gap: 16px; align-items: flex-end; justify-content: space-between; margin-bottom: 22px; }
.home-section__label { display: flex; gap: 7px; align-items: center; margin: 0 0 7px; color: var(--site-guide); font-size: 12px; letter-spacing: 1px; }
.home-section__label::before { width: 5px; height: 5px; border-radius: 50%; background: currentColor; content: ''; }
.home-updates .home-section__label { color: var(--site-secondary); }
.home-questions .home-section__label { color: var(--home-muted); }
.home-section h2 { margin: 0; font-size: 24px; font-weight: 650; line-height: 1.4; letter-spacing: -.5px; }
.home-text-link { flex-shrink: 0; padding: 4px 0; color: var(--home-muted); font-size: 13px; }
.home-text-link > span { margin-left: 6px; }
.home-device-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.home-device { --device-accent: var(--site-guide); --device-soft: var(--site-guide-soft); --device-border: var(--site-guide-border); position: relative; padding: 24px; border: 1px solid var(--device-border); border-radius: 14px; background: linear-gradient(155deg, var(--device-soft), transparent 75%), var(--vp-c-bg); color: inherit; transition: border-color .2s, background-color .2s; }
.home-device[data-tone="violet"] { --device-accent: var(--site-secondary); --device-soft: var(--site-secondary-soft); --device-border: var(--site-secondary-border); }
.home-device[data-tone="teal"] { --device-accent: var(--site-tool); --device-soft: var(--site-tool-soft); --device-border: var(--site-tool-border); }
.home-device:hover { border-color: var(--device-accent); background: var(--device-soft); }
.home-device__icon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; margin-bottom: 21px; border-radius: 10px; background: var(--device-soft); color: var(--device-accent); }
.home-device__icon svg { width: 23px; height: 23px; }
.home-device__arrow { position: absolute; top: 28px; right: 24px; color: var(--vp-c-text-3); font-size: 18px; }
.home-device:hover .home-device__arrow { color: var(--device-accent); }
.home-device h3 { margin: 0 0 6px; font-size: 18px; font-weight: 600; }
.home-device__subtitle { margin: 0; color: var(--device-accent); font-size: 13px; }
.home-device__description { margin: 16px 0 0; color: var(--vp-c-text-3); font-size: 13px; line-height: 1.7; }
.home-more-guides { display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; padding-top: 20px; font-size: 12px; }
.home-more-guides > span { color: var(--vp-c-text-3); }
.home-more-guides a { color: var(--home-muted); }
.home-more-guides a > span { margin-left: 4px; color: var(--vp-c-text-3); }
.home-node-tool { border: 1px solid var(--site-tool-border); border-radius: 14px; background: var(--site-tool-soft); scroll-margin-top: calc(var(--vp-nav-height, 64px) + 20px); }
.home-node-tool > summary { display: flex; gap: 18px; align-items: center; padding: 24px; cursor: pointer; list-style: none; }
.home-node-tool > summary::-webkit-details-marker, .home-question-list summary::-webkit-details-marker { display: none; }
.home-tool-icon { display: flex; flex-shrink: 0; align-items: center; justify-content: center; width: 42px; height: 42px; border: 1px solid var(--site-tool-border); border-radius: 10px; background: var(--vp-c-bg); color: var(--site-tool); }
.home-tool-icon svg { width: 24px; height: 24px; }
.home-tool-copy { display: grid; gap: 6px; min-width: 0; }
.home-tool-copy strong { font-size: 16px; font-weight: 600; }
.home-tool-copy > span { color: var(--home-muted); font-size: 13px; line-height: 1.6; }
.home-tool-toggle { display: inline-flex; flex-shrink: 0; gap: 14px; align-items: center; margin-left: auto; color: var(--site-tool); font-size: 13px; }
.home-node-tool > summary:focus-visible { outline-color: var(--site-tool); }
.home-tool-toggle > span, .home-question-list summary > span { display: inline-block; font-size: 20px; line-height: 1; transition: transform .2s; }
.home-node-tool[open] .home-tool-toggle > span, .home-question-list details[open] summary > span { transform: rotate(45deg); }
.home-node-tool__body { padding: 4px 24px 24px; }
.home-update { display: grid; grid-template-columns: 52px 72px minmax(0, 1fr) 20px; gap: 20px; align-items: center; min-height: 65px; padding: 14px 0; border-top: 1px solid var(--home-border); color: inherit; }
.home-update:last-child { border-bottom: 1px solid var(--home-border); }
.home-update time { color: var(--vp-c-text-3); font-size: 13px; font-variant-numeric: tabular-nums; }
.home-update__category { width: fit-content; padding: 3px 8px; border-radius: 5px; background: var(--site-secondary-soft); color: var(--site-secondary); font-size: 12px; }
.home-update:nth-child(2) .home-update__category { background: var(--site-tool-soft); color: var(--site-tool); }
.home-update:nth-child(3) .home-update__category { background: var(--site-guide-soft); color: var(--site-guide); }
.home-update h3 { margin: 0; font-size: 14px; font-weight: 500; line-height: 1.7; }
.home-update__arrow { color: var(--vp-c-text-3); text-align: right; }
.home-update:hover h3, .home-update:hover .home-update__arrow { color: var(--vp-c-brand-1); }
.home-question-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 40px; align-items: start; }
.home-question-list details { border-top: 1px solid var(--home-border); }
.home-question-list summary { display: flex; gap: 16px; align-items: center; justify-content: space-between; min-height: 60px; padding: 16px 0; font-size: 13px; line-height: 1.6; cursor: pointer; list-style: none; }
.home-question-list summary > span { flex-shrink: 0; color: var(--vp-c-text-3); font-size: 17px; }
.home-question-answer { padding: 0 18px 20px 0; color: var(--home-muted); font-size: 13px; line-height: 1.9; }
.home-question-answer p { margin: 0 0 10px; }
.home-question-answer a { color: var(--vp-c-brand-1); }
.home-note { padding: 0 0 40px; text-align: center; }
.home-note p { margin: 0 0 10px; color: var(--home-muted); font-size: 14px; font-weight: 500; }
.home-note > span { color: var(--vp-c-text-3); font-size: 12px; line-height: 1.9; }
.home-note a { color: var(--home-muted); text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 719px) {
  .home-landing { padding: 0 22px; }
  .home-intro { padding: 62px 0 48px; }
  .home-eyebrow { margin-bottom: 20px; font-size: 11px; }
  .home-intro h1 { font-size: clamp(30px, 7.6vw, 46px); letter-spacing: -1px; }
  .home-intro__description { margin: 20px 0 24px; font-size: 14px; }
  .home-intro__actions { gap: 10px; }
  .home-primary-action { gap: 12px; padding: 0 18px; }
  .home-shortcuts { gap: 10px; font-size: 11px; }
  .home-section { margin-bottom: 36px; }
  .home-section h2 { font-size: 21px; }
  .home-section__heading { margin-bottom: 18px; }
  .home-device-grid { grid-template-columns: 1fr; gap: 10px; }
  .home-device { display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 5px 16px; padding: 20px; }
  .home-device__icon { grid-row: 1 / 3; align-self: center; margin: 0; }
  .home-device h3 { padding-right: 22px; margin: 0; font-size: 16px; }
  .home-device__subtitle { font-size: 12px; }
  .home-device__description { grid-column: 2; margin: 4px 0 0; font-size: 12px; }
  .home-device__arrow { top: 20px; right: 20px; }
  .home-more-guides { gap: 12px 18px; }
  .home-more-guides > span { flex-basis: 100%; }
  .home-node-tool > summary { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; gap: 8px 12px; padding: 20px; }
  .home-tool-icon { grid-row: 1 / 3; align-self: start; }
  .home-tool-copy { display: contents; }
  .home-tool-copy strong { grid-column: 2; grid-row: 1; }
  .home-tool-copy > span { grid-column: 2 / 4; grid-row: 2; font-size: 12px; }
  .home-tool-toggle { grid-column: 3; grid-row: 1; gap: 8px; margin: 0; font-size: 12px; }
  .home-node-tool__body { padding: 0 16px 20px; }
  .home-update { grid-template-columns: 42px minmax(0, 1fr) 16px; gap: 12px; padding: 16px 0; }
  .home-update__category { display: none; }
  .home-update h3 { font-size: 13px; }
  .home-question-list { grid-template-columns: 1fr; }
  .home-question-list summary { min-height: 55px; }
  .home-note { padding-bottom: 30px; }
}
@media (max-width: 380px) {
  .home-intro__actions { flex-direction: column; }
  .home-primary-action { width: min(100%, 260px); }
  .home-intro__actions :deep(.airport-finder--compact) { width: min(100%, 260px); }
  .home-intro__actions :deep(.finder-compact-button) { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .home-landing *, .home-landing *::before, .home-landing *::after { transition: none !important; scroll-behavior: auto !important; }
}
</style>
