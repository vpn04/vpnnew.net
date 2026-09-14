<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'

type NodeStatus = 'online' | 'timeout' | 'blocked' | 'unsupported' | 'error'

type TestedNode = {
  id: number
  name: string
  type: string
  server: string
  port: number
  status: NodeStatus
  latencyMs: number | null
  fastestMs: number | null
  successRate: number
  reason?: string
}

type NodeTestResponse = {
  ok: true
  sourceHost: string
  edgeLocation: string
  totalNodes: number
  testedNodes: number
  truncated: boolean
  elapsedMs: number
  summary: {
    online: number
    unavailable: number
    unsupported: number
    averageLatencyMs: number | null
  }
  nodes: TestedNode[]
}

type ErrorResponse = {
  ok?: false
  code?: string
  error?: string
}

const subscriptionUrl = ref('')
const showSubscription = ref(false)
const privacyAccepted = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const result = ref<NodeTestResponse | null>(null)
let activeController: AbortController | undefined

const getApiEndpoints = (): string[] => {
  const configuredEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined
  if (configuredEndpoint)
    return [`${configuredEndpoint.replace(/\/$/, '')}/node-test`]

  if (
    typeof window !== 'undefined'
    && ['127.0.0.1', 'localhost'].includes(window.location.hostname)
  )
    return [
      'http://127.0.0.1:8787/node-test',
      'https://vpnnew.net/api/analytics/node-test',
    ]

  return ['/api/analytics/node-test']
}

const requestNodeTest = async (
  submittedUrl: string,
  signal: AbortSignal,
): Promise<Response> => {
  const endpoints = getApiEndpoints()
  let lastNetworkError: unknown

  for (const [index, endpoint] of endpoints.entries()) {
    try {
      return await fetch(endpoint, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ subscriptionUrl: submittedUrl }),
        credentials: 'omit',
        cache: 'no-store',
        signal,
      })
    }
    catch (error) {
      lastNetworkError = error
      const hasFallback = index < endpoints.length - 1
      if (!(error instanceof TypeError) || !hasFallback || signal.aborted)
        throw error
    }
  }

  throw lastNetworkError
}

const isValidInput = computed(() => {
  try {
    return new URL(subscriptionUrl.value.trim()).protocol === 'https:'
  }
  catch {
    return false
  }
})

const canStart = computed(() => isValidInput.value && privacyAccepted.value && !loading.value)

const sortedNodes = computed(() => {
  if (!result.value)
    return []

  const order: Record<NodeStatus, number> = {
    online: 0,
    timeout: 1,
    error: 2,
    blocked: 3,
    unsupported: 4,
  }

  return [...result.value.nodes].sort((first, second) => {
    const statusDifference = order[first.status] - order[second.status]
    if (statusDifference)
      return statusDifference

    return (first.latencyMs ?? Number.MAX_SAFE_INTEGER) - (second.latencyMs ?? Number.MAX_SAFE_INTEGER)
  })
})

const statusMeta: Record<NodeStatus, { label: string, tone: string }> = {
  online: { label: 'TCP 可达', tone: 'success' },
  timeout: { label: '连接超时', tone: 'warning' },
  error: { label: '连接失败', tone: 'danger' },
  blocked: { label: '安全拦截', tone: 'muted' },
  unsupported: { label: 'UDP 未检测', tone: 'muted' },
}

const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000)
    return `${milliseconds} ms`
  return `${(milliseconds / 1000).toFixed(1)} 秒`
}

const pasteSubscription = async (): Promise<void> => {
  errorMessage.value = ''

  try {
    const text = await navigator.clipboard.readText()
    subscriptionUrl.value = text.trim()
  }
  catch {
    errorMessage.value = '浏览器没有授予剪贴板权限，请手动粘贴订阅链接。'
  }
}

const clearResult = (): void => {
  result.value = null
  errorMessage.value = ''
}

const runTest = async (): Promise<void> => {
  if (!canStart.value)
    return

  const submittedUrl = subscriptionUrl.value.trim()
  subscriptionUrl.value = ''
  errorMessage.value = ''
  result.value = null
  loading.value = true

  activeController?.abort()
  const controller = new AbortController()
  activeController = controller
  const timeout = window.setTimeout(() => controller.abort(), 55000)

  try {
    const response = await requestNodeTest(submittedUrl, controller.signal)
    const data = await response.json().catch(() => ({})) as NodeTestResponse | ErrorResponse

    if (!response.ok || !data.ok) {
      const fallback = response.status === 404
        ? '节点检测服务尚未部署，请稍后再试。'
        : '节点检测失败，请检查订阅链接后重试。'
      throw new Error('error' in data && data.error ? data.error : fallback)
    }

    result.value = data
  }
  catch (error) {
    errorMessage.value = controller.signal.aborted
      ? '检测等待时间过长，已自动停止，请稍后重试。'
      : error instanceof TypeError
        ? '无法连接节点检测服务，请刷新页面后重试；本地预览时需要同时启动 analytics-worker。'
      : error instanceof Error
        ? error.message
        : '节点检测失败，请稍后重试。'
  }
  finally {
    window.clearTimeout(timeout)
    if (activeController === controller)
      activeController = undefined
    loading.value = false
  }
}

const stopTest = (): void => {
  activeController?.abort()
}

onUnmounted(() => {
  activeController?.abort()
})
</script>

<template>
  <section id="airport-node-test" class="airport-speed-test-section" aria-labelledby="airport-speed-test-title">
    <div class="airport-speed-test-shell">
      <a class="airport-featured-guide" href="/vpn-recommend/">
        <span class="airport-featured-guide__badge">2026 长期更新 · 本站主推</span>
        <span class="airport-featured-guide__content">
          <small>测速前不知道选哪家？先看完整榜单</small>
          <strong>2026年翻墙机场推荐评测｜稳定便宜VPN机场排行榜（高性价比科学上网工具长期更新）</strong>
        </span>
        <span class="airport-featured-guide__action">查看推荐榜 <b aria-hidden="true">→</b></span>
      </a>

      <header class="airport-speed-test-header">
        <div>
          <p class="airport-speed-test-kicker">
            Subscription Node Check
          </p>
          <h2 id="airport-speed-test-title">
            机场订阅节点在线检测
          </h2>
          <p>
            粘贴自己的 HTTPS 机场订阅链接，系统会临时解析节点，并检测每个 TCP 节点的端口可达率与握手延迟。无需安装额外测速软件。
          </p>
        </div>

        <div class="airport-speed-test-privacy" title="订阅不会写入本站数据库">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 5 6v5c0 4.7 2.9 8.7 7 10 4.1-1.3 7-5.3 7-10V6l-7-3Zm3.2 7.1-3.8 4.2a1 1 0 0 1-1.5 0l-2-2.1 1.4-1.4 1.3 1.3 3.1-3.4 1.5 1.4Z" />
          </svg>
          <span>不保存订阅与节点</span>
        </div>
      </header>

      <div class="airport-speed-test-panel">
        <div class="airport-speed-test-steps" aria-label="节点检测步骤">
          <span><b>1</b> 粘贴个人订阅</span>
          <span><b>2</b> 临时解析节点</span>
          <span><b>3</b> 查看可达性数据</span>
        </div>

        <form class="airport-subscription-form" @submit.prevent="runTest">
          <label for="airport-subscription-url">机场订阅链接</label>
          <div class="airport-subscription-input">
            <input
              id="airport-subscription-url"
              v-model.trim="subscriptionUrl"
              :type="showSubscription ? 'text' : 'password'"
              :disabled="loading"
              placeholder="https://example.com/api/v1/client/subscribe?token=••••••"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              aria-describedby="airport-subscription-help"
              data-1p-ignore
            >
            <button
              class="airport-subscription-visibility"
              type="button"
              :aria-label="showSubscription ? '隐藏订阅链接' : '显示订阅链接'"
              :title="showSubscription ? '隐藏订阅链接' : '显示订阅链接'"
              @click="showSubscription = !showSubscription"
            >
              <svg v-if="showSubscription" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5c5 0 9 4.6 10 7-1 2.4-5 7-10 7S3 14.4 2 12c1-2.4 5-7 10-7Zm0 2c-3.4 0-6.5 2.9-7.8 5 1.3 2.1 4.4 5 7.8 5s6.5-2.9 7.8-5C18.5 9.9 15.4 7 12 7Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="m3.3 2 18.7 18.7-1.3 1.3-3.2-3.2A10.6 10.6 0 0 1 12 20c-5 0-9-4.6-10-7a15.2 15.2 0 0 1 4.2-5.2L2 3.3 3.3 2Zm4.3 7.2A12.5 12.5 0 0 0 4.2 13c1.3 2.1 4.4 5 7.8 5 1.4 0 2.8-.5 4-1.1l-2-2a3.1 3.1 0 0 1-4-4l-2.4-1.7ZM12 6c5 0 9 4.6 10 7a14.4 14.4 0 0 1-2.7 3.8l-1.4-1.4c.8-.8 1.4-1.7 1.9-2.4-1.3-2.1-4.4-5-7.8-5-.8 0-1.5.1-2.2.4L8.2 6.8A10 10 0 0 1 12 6Z" />
              </svg>
            </button>
            <button
              class="airport-subscription-paste"
              type="button"
              :disabled="loading"
              @click="pasteSubscription"
            >
              粘贴
            </button>
          </div>

          <div id="airport-subscription-help" class="airport-subscription-help">
            <span>支持 Clash YAML、Base64、SS、SSR、VMess、VLESS、Trojan、AnyTLS 等常见格式</span>
            <span>提交后输入框会立即清空，最多检测前 24 个节点</span>
          </div>

          <label class="airport-privacy-consent">
            <input v-model="privacyAccepted" type="checkbox" :disabled="loading">
            <span>我确认这是自己的订阅，并了解链接会临时发送至检测服务；本站不会保存链接、令牌或节点数据。</span>
          </label>

          <div v-if="errorMessage" class="airport-speed-test-error" role="alert">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2 1 21h22L12 2Zm0 5 6.1 12H5.9L12 7Zm-1 3v5h2v-5h-2Zm0 6.5v2h2v-2h-2Z" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <div class="airport-speed-test-actions">
            <button
              v-if="!loading"
              class="airport-speed-test-start"
              type="submit"
              :disabled="!canStart"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-2.1-5l-3.5 3.5 1.4 1.4L21 5.7V12h-2V8.4A9 9 0 0 0 12 3Zm-1 5v5.4l4.2 2.5 1-1.7-3.2-1.9V8h-2Z" />
              </svg>
              解析订阅并检测节点
            </button>
            <button v-else class="airport-speed-test-stop" type="button" @click="stopTest">
              停止检测
            </button>
            <button
              v-if="result && !loading"
              class="airport-speed-test-clear"
              type="button"
              @click="clearResult"
            >
              清除结果
            </button>
          </div>
        </form>

        <div v-if="loading" class="airport-speed-test-loading" role="status" aria-live="polite">
          <span class="airport-speed-test-spinner" aria-hidden="true" />
          <div>
            <strong>正在安全读取订阅并检测节点</strong>
            <span>节点会分批测试，每个节点检测 2 次；失效节点可能需要等待超时。</span>
          </div>
        </div>

        <template v-else-if="result">
          <section class="airport-speed-summary" aria-label="节点检测概览">
            <header>
              <div>
                <span>检测完成 · Cloudflare {{ result.edgeLocation }}</span>
                <strong>{{ result.sourceHost }}</strong>
              </div>
              <small>用时 {{ formatDuration(result.elapsedMs) }}</small>
            </header>

            <div class="airport-speed-summary__cards">
              <article>
                <span>解析节点</span>
                <strong>{{ result.totalNodes }}</strong>
                <small>{{ result.truncated ? '仅检测前24个' : '已全部解析' }}</small>
              </article>
              <article class="is-success">
                <span>TCP 可达</span>
                <strong>{{ result.summary.online }}</strong>
                <small>两次探测至少成功一次</small>
              </article>
              <article class="is-danger">
                <span>不可达</span>
                <strong>{{ result.summary.unavailable }}</strong>
                <small>超时、失败或被拦截</small>
              </article>
              <article class="is-latency">
                <span>平均握手</span>
                <strong>{{ result.summary.averageLatencyMs ?? '--' }}</strong>
                <small>{{ result.summary.averageLatencyMs === null ? '暂无数据' : 'ms · 仅可达节点' }}</small>
              </article>
            </div>
          </section>

          <div class="airport-node-table-wrap">
            <table class="airport-node-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>节点与协议</th>
                  <th>服务器</th>
                  <th>平均/最快</th>
                  <th>成功率</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="node in sortedNodes" :key="`${node.id}-${node.server}-${node.port}`">
                  <td data-label="#">{{ node.id }}</td>
                  <td data-label="节点与协议">
                    <strong>{{ node.name }}</strong>
                    <small>{{ node.type.toUpperCase() }}</small>
                  </td>
                  <td data-label="服务器">
                    <code>{{ node.server }}:{{ node.port }}</code>
                  </td>
                  <td data-label="平均/最快">
                    <strong v-if="node.latencyMs !== null">{{ node.latencyMs }} ms</strong>
                    <span v-else>--</span>
                    <small v-if="node.fastestMs !== null">最快 {{ node.fastestMs }} ms</small>
                  </td>
                  <td data-label="成功率">{{ node.status === 'unsupported' ? '--' : `${node.successRate}%` }}</td>
                  <td data-label="状态">
                    <span :class="['airport-node-status', `is-${statusMeta[node.status].tone}`]">
                      {{ statusMeta[node.status].label }}
                    </span>
                    <small v-if="node.reason">{{ node.reason }}</small>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <div v-else class="airport-speed-test-empty">
          <svg viewBox="0 0 64 48" aria-hidden="true">
            <path d="M6 40h52M12 34a20 20 0 0 1 40 0M20 34a12 12 0 0 1 24 0" />
            <path d="m32 34 10-12" />
            <circle cx="32" cy="34" r="3" />
          </svg>
          <div>
            <strong>粘贴订阅后查看各节点数据</strong>
            <span>检测仅在点击后开始，不会自动读取剪贴板，也不会在页面地址或浏览记录中留下订阅令牌。</span>
          </div>
        </div>
      </div>

      <footer class="airport-speed-test-note">
        <p>
          <strong>结果边界：</strong>这里测量的是 Cloudflare 边缘到节点服务器的 TCP 端口可达性和握手时间，不是你本地到机场的 Ping、带宽或代理出口测试。Hysteria2、TUIC 等 UDP 节点只解析、不探测。
        </p>
        <p>
          “TCP 可达”只说明服务器端口有响应，不代表节点一定能正常代理、解锁流媒体或长期稳定。最终仍应在 Clash、Shadowrocket 中进行本地晚高峰和真实业务测试。
          <a href="/article/airport-subscription-node-test-guide-2026/">查看完整测速教程</a>
        </p>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.airport-speed-test-section {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  scroll-margin-top: 84px;
  padding: 62px 24px;
  overflow: hidden;
}

.airport-speed-test-shell {
  width: 100%;
  max-width: 1120px;
  min-width: 0;
  margin: 0 auto;
}

.airport-featured-guide {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  margin-bottom: 34px;
  border: 1px solid rgba(245, 158, 11, 0.38);
  border-radius: 12px;
  background:
    linear-gradient(110deg, rgba(245, 158, 11, 0.15), rgba(37, 99, 235, 0.08)),
    var(--vp-c-bg-soft);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.07);
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.airport-featured-guide:hover {
  border-color: #f59e0b;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.11);
  transform: translateY(-2px);
}

.airport-featured-guide__badge {
  padding: 7px 10px;
  border-radius: 999px;
  background: #f59e0b;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.airport-featured-guide__content {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.airport-featured-guide__content small {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.airport-featured-guide__content strong {
  color: var(--vp-c-text-1);
  font-size: 15px;
  line-height: 1.55;
}

.airport-featured-guide__action {
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.airport-speed-test-header {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.airport-speed-test-kicker {
  margin: 0 0 8px;
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.airport-speed-test-header h2 {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 32px;
  line-height: 1.2;
  text-wrap: balance;
}

.airport-speed-test-header p:not(.airport-speed-test-kicker) {
  max-width: 760px;
  margin: 12px 0 0;
  color: var(--vp-c-text-2);
  font-size: 16px;
  line-height: 1.75;
}

.airport-speed-test-privacy {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 8px;
  align-items: center;
  padding: 9px 12px;
  border: 1px solid rgba(34, 197, 94, 0.28);
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.08);
  color: #15803d;
  font-size: 13px;
  font-weight: 700;
}

[data-theme="dark"] .airport-speed-test-privacy {
  color: #86efac;
}

.airport-speed-test-privacy svg,
.airport-speed-test-error svg,
.airport-speed-test-start svg {
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  fill: currentColor;
}

.airport-speed-test-panel {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background:
    linear-gradient(135deg, var(--vp-c-brand-soft), transparent 34%),
    var(--vp-c-bg-soft);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.06);
}

.airport-speed-test-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-bottom: 18px;
}

.airport-speed-test-steps span {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 700;
}

.airport-speed-test-steps b {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 23px;
  height: 23px;
  border-radius: 50%;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 12px;
}

.airport-subscription-form > label:first-child {
  display: block;
  margin-bottom: 7px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 800;
}

.airport-subscription-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px auto;
  align-items: stretch;
  min-width: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.airport-subscription-input:focus-within {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.airport-subscription-input input {
  min-width: 0;
  min-height: 50px;
  padding: 0 14px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--vp-c-text-1);
  font: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
}

.airport-subscription-input button {
  border: 0;
  border-left: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.airport-subscription-input button:hover {
  color: var(--vp-c-brand-1);
}

.airport-subscription-input button:focus-visible,
.airport-speed-test-actions button:focus-visible,
.airport-privacy-consent input:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.airport-subscription-visibility {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.airport-subscription-visibility svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.airport-subscription-paste {
  min-width: 68px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 800;
}

.airport-subscription-help {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--vp-c-text-3);
  font-size: 11px;
  line-height: 1.6;
}

.airport-privacy-consent {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  margin-top: 16px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 12px;
  line-height: 1.65;
}

.airport-privacy-consent input {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: var(--vp-c-brand-1);
}

.airport-speed-test-error {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  padding: 11px 13px;
  margin-top: 14px;
  border: 1px solid rgba(239, 68, 68, 0.24);
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
  font-size: 12px;
  line-height: 1.6;
}

[data-theme="dark"] .airport-speed-test-error {
  color: #fca5a5;
}

.airport-speed-test-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 17px;
}

.airport-speed-test-actions button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 9px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.airport-speed-test-actions button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.airport-speed-test-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.airport-speed-test-start {
  border-color: var(--vp-c-brand-1) !important;
  background: var(--vp-c-brand-1);
  box-shadow: 0 10px 24px var(--vp-c-brand-soft);
  color: var(--vp-c-white);
}

.airport-speed-test-stop,
.airport-speed-test-clear {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.airport-speed-test-loading,
.airport-speed-test-empty {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: center;
  min-height: 132px;
  margin-top: 20px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 10px;
  background: color-mix(in srgb, var(--vp-c-bg) 72%, transparent);
}

.airport-speed-test-loading div,
.airport-speed-test-empty div {
  display: grid;
  gap: 4px;
}

.airport-speed-test-loading strong,
.airport-speed-test-empty strong {
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.airport-speed-test-loading span:not(.airport-speed-test-spinner),
.airport-speed-test-empty span {
  max-width: 560px;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 1.6;
}

.airport-speed-test-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--vp-c-brand-soft);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: airport-speed-spin 0.8s linear infinite;
}

.airport-speed-test-empty svg {
  width: 56px;
  height: 42px;
  fill: none;
  stroke: var(--vp-c-brand-1);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.airport-speed-summary {
  margin-top: 22px;
}

.airport-speed-summary > header {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 11px;
}

.airport-speed-summary > header > div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.airport-speed-summary > header span,
.airport-speed-summary > header small {
  color: var(--vp-c-text-3);
  font-size: 11px;
}

.airport-speed-summary > header strong {
  overflow: hidden;
  color: var(--vp-c-text-1);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.airport-speed-summary__cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.airport-speed-summary__cards article {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--vp-c-divider);
  border-top: 3px solid var(--vp-c-brand-1);
  border-radius: 9px;
  background: var(--vp-c-bg);
}

.airport-speed-summary__cards article.is-success {
  border-top-color: #22c55e;
}

.airport-speed-summary__cards article.is-danger {
  border-top-color: #ef4444;
}

.airport-speed-summary__cards article.is-latency {
  border-top-color: #8b5cf6;
}

.airport-speed-summary__cards span,
.airport-speed-summary__cards small {
  color: var(--vp-c-text-3);
  font-size: 11px;
}

.airport-speed-summary__cards strong {
  color: var(--vp-c-text-1);
  font-size: 28px;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.airport-node-table-wrap {
  margin-top: 14px;
  overflow-x: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
}

.airport-node-table {
  width: 100%;
  min-width: 850px;
  border-collapse: collapse;
  font-size: 12px;
}

.airport-node-table th,
.airport-node-table td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  text-align: left;
  vertical-align: middle;
}

.airport-node-table th {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3);
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.airport-node-table tbody tr:last-child td {
  border-bottom: 0;
}

.airport-node-table td:nth-child(2),
.airport-node-table td:nth-child(4),
.airport-node-table td:nth-child(6) {
  display: table-cell;
}

.airport-node-table td strong,
.airport-node-table td small {
  display: block;
}

.airport-node-table td strong {
  max-width: 250px;
  overflow: hidden;
  color: var(--vp-c-text-1);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.airport-node-table td small {
  margin-top: 3px;
  color: var(--vp-c-text-3);
  font-size: 10px;
}

.airport-node-table code {
  display: inline-block;
  max-width: 230px;
  overflow: hidden;
  color: var(--vp-c-text-2);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.airport-node-status {
  display: inline-flex;
  padding: 4px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.airport-node-status.is-success {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.airport-node-status.is-warning {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.airport-node-status.is-danger {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.airport-node-status.is-muted {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3);
}

[data-theme="dark"] .airport-node-status.is-success {
  color: #86efac;
}

[data-theme="dark"] .airport-node-status.is-warning {
  color: #fcd34d;
}

[data-theme="dark"] .airport-node-status.is-danger {
  color: #fca5a5;
}

.airport-speed-test-note {
  display: grid;
  gap: 5px;
  margin-top: 14px;
}

.airport-speed-test-note p {
  margin: 0;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 1.75;
}

.airport-speed-test-note strong {
  color: var(--vp-c-text-2);
}

.airport-speed-test-note a {
  color: var(--vp-c-brand-1);
  font-weight: 700;
  text-decoration: none;
}

.airport-speed-test-note a:hover {
  text-decoration: underline;
}

@keyframes airport-speed-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 840px) {
  .airport-featured-guide {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .airport-featured-guide__badge {
    grid-column: 1 / -1;
    width: fit-content;
  }

  .airport-speed-test-header {
    display: grid;
  }

  .airport-speed-test-privacy {
    width: fit-content;
  }

  .airport-speed-summary__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .airport-speed-test-section {
    padding: 44px 16px;
  }

  .airport-featured-guide {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 16px;
    margin-bottom: 28px;
  }

  .airport-featured-guide__action {
    white-space: normal;
  }

  .airport-speed-test-header h2 {
    font-size: 27px;
  }

  .airport-speed-test-panel {
    padding: 16px;
    border-radius: 12px;
  }

  .airport-speed-test-steps {
    display: grid;
  }

  .airport-subscription-input {
    grid-template-columns: minmax(0, 1fr) 42px;
  }

  .airport-subscription-paste {
    grid-column: 1 / -1;
    min-height: 40px;
    border-top: 1px solid var(--vp-c-divider) !important;
    border-left: 0 !important;
  }

  .airport-subscription-help {
    display: grid;
  }

  .airport-speed-test-actions button {
    width: 100%;
  }

  .airport-speed-test-loading,
  .airport-speed-test-empty {
    align-items: flex-start;
    justify-content: flex-start;
    min-height: auto;
    padding: 18px;
  }

  .airport-speed-test-empty svg {
    flex: 0 0 auto;
    width: 42px;
    height: 32px;
  }

  .airport-speed-summary__cards {
    grid-template-columns: 1fr 1fr;
  }

  .airport-node-table-wrap {
    overflow: visible;
    border: 0;
    background: transparent;
  }

  .airport-node-table,
  .airport-node-table tbody,
  .airport-node-table tr,
  .airport-node-table td {
    display: block !important;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  .airport-node-table {
    min-width: 0;
  }

  .airport-node-table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .airport-node-table tr {
    padding: 10px 12px;
    margin-bottom: 10px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 9px;
    background: var(--vp-c-bg);
  }

  .airport-node-table td {
    display: grid !important;
    grid-template-columns: 92px minmax(0, 1fr) !important;
    gap: 10px;
    align-items: center;
    padding: 7px 0;
    border: 0;
  }

  .airport-node-table td::before {
    color: var(--vp-c-text-3);
    content: attr(data-label);
    font-size: 10px;
    font-weight: 800;
  }

  .airport-node-table td strong,
  .airport-node-table code {
    max-width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .airport-featured-guide,
  .airport-speed-test-actions button {
    transition: none;
  }

  .airport-speed-test-spinner {
    animation-duration: 1.8s;
  }
}
</style>
