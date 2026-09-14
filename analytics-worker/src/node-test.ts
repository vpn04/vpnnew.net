import { connect } from 'cloudflare:sockets'
import {
  isUdpOnlyProtocol,
  isUnsafeHostname,
  parseSubscriptionText,
  type ParsedNode,
} from './subscription-parser'

type NodeTestOutcome = {
  data: unknown
  init?: ResponseInit
}

type NodeProbeStatus = 'online' | 'timeout' | 'blocked' | 'unsupported' | 'error'

type NodeProbe = {
  id: number
  name: string
  type: string
  server: string
  port: number
  status: NodeProbeStatus
  latencyMs: number | null
  fastestMs: number | null
  successRate: number
  reason?: string
}

type ProbeAttempt = {
  ok: boolean
  latencyMs: number | null
  status: Exclude<NodeProbeStatus, 'online' | 'unsupported'> | 'online'
}

const MAX_REQUEST_BYTES = 4096
const MAX_SUBSCRIPTION_BYTES = 384 * 1024
const MAX_SUBSCRIPTION_URL_LENGTH = 2048
const MAX_NODES = 24
const PROBE_ATTEMPTS = 2
const PROBE_CONCURRENCY = 5
const PROBE_TIMEOUT_MS = 3500
const FETCH_TIMEOUT_MS = 9000
const ALLOWED_SUBSCRIPTION_PORTS = new Set(['', '443', '8443', '9443', '2053', '2083', '2087', '2096'])

class SafeNodeTestError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = 'SafeNodeTestError'
    this.code = code
    this.status = status
  }
}

const readTextLimited = async (body: ReadableStream<Uint8Array> | null, limit: number): Promise<string> => {
  if (!body)
    return ''

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done)
        break

      size += value.byteLength
      if (size > limit) {
        await reader.cancel('payload_too_large')
        throw new SafeNodeTestError('PAYLOAD_TOO_LARGE', '订阅内容过大，暂时只支持 384KB 以内的订阅。', 413)
      }

      chunks.push(value)
    }
  }
  finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder().decode(bytes)
}

const parseRequest = async (request: Request): Promise<string> => {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES)
    throw new SafeNodeTestError('REQUEST_TOO_LARGE', '请求内容过大。', 413)

  const text = await readTextLimited(request.body, MAX_REQUEST_BYTES)
  let payload: unknown

  try {
    payload = JSON.parse(text)
  }
  catch {
    throw new SafeNodeTestError('INVALID_REQUEST', '请求格式不正确。')
  }

  if (!payload || typeof payload !== 'object')
    throw new SafeNodeTestError('INVALID_REQUEST', '请求格式不正确。')

  const subscriptionUrl = (payload as Record<string, unknown>).subscriptionUrl
  if (typeof subscriptionUrl !== 'string' || !subscriptionUrl.trim())
    throw new SafeNodeTestError('MISSING_SUBSCRIPTION_URL', '请粘贴机场订阅链接。')

  return subscriptionUrl.trim()
}

const validateSubscriptionUrl = (value: string, base?: string): URL => {
  if (value.length > MAX_SUBSCRIPTION_URL_LENGTH)
    throw new SafeNodeTestError('INVALID_SUBSCRIPTION_URL', '订阅链接过长。')

  let url: URL
  try {
    url = base ? new URL(value, base) : new URL(value)
  }
  catch {
    throw new SafeNodeTestError('INVALID_SUBSCRIPTION_URL', '订阅链接格式不正确。')
  }

  if (url.protocol !== 'https:')
    throw new SafeNodeTestError('HTTPS_REQUIRED', '为保护订阅令牌，只支持 HTTPS 订阅链接。')

  if (url.username || url.password || url.hash)
    throw new SafeNodeTestError('INVALID_SUBSCRIPTION_URL', '订阅链接不能包含账号密码或片段标识。')

  if (!ALLOWED_SUBSCRIPTION_PORTS.has(url.port))
    throw new SafeNodeTestError('UNSUPPORTED_SUBSCRIPTION_PORT', '订阅地址使用了暂不支持的 Web 端口。')

  if (isUnsafeHostname(url.hostname))
    throw new SafeNodeTestError('BLOCKED_SUBSCRIPTION_HOST', '该订阅地址不允许访问。')

  return url
}

const fetchWithTimeout = async (url: URL): Promise<Response> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'text/plain, application/yaml, application/json;q=0.9, */*;q=0.5',
        'user-agent': 'Clash/vpnnew.net-node-check',
      },
      redirect: 'manual',
      signal: controller.signal,
    })
  }
  catch {
    throw new SafeNodeTestError('SUBSCRIPTION_FETCH_FAILED', '无法读取订阅，请检查链接是否有效或稍后重试。', 502)
  }
  finally {
    clearTimeout(timer)
  }
}

const fetchSubscription = async (initialUrl: URL): Promise<string> => {
  let currentUrl = initialUrl

  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetchWithTimeout(currentUrl)

    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel()
      const location = response.headers.get('location')
      if (!location)
        throw new SafeNodeTestError('INVALID_REDIRECT', '订阅地址返回了无效跳转。', 502)
      if (redirectCount === 3)
        throw new SafeNodeTestError('TOO_MANY_REDIRECTS', '订阅地址跳转次数过多。', 502)

      currentUrl = validateSubscriptionUrl(location, currentUrl.toString())
      continue
    }

    if (!response.ok) {
      await response.body?.cancel()
      throw new SafeNodeTestError('SUBSCRIPTION_HTTP_ERROR', `订阅地址返回 HTTP ${response.status}。`, 502)
    }

    const declaredLength = Number(response.headers.get('content-length') || 0)
    if (Number.isFinite(declaredLength) && declaredLength > MAX_SUBSCRIPTION_BYTES) {
      await response.body?.cancel()
      throw new SafeNodeTestError('SUBSCRIPTION_TOO_LARGE', '订阅内容过大，暂时只支持 384KB 以内的订阅。', 413)
    }

    const content = (await readTextLimited(response.body, MAX_SUBSCRIPTION_BYTES)).trim()
    if (!content)
      throw new SafeNodeTestError('EMPTY_SUBSCRIPTION', '订阅内容为空，请检查链接是否过期。', 422)

    if (/^\s*<!doctype html|^\s*<html/i.test(content))
      throw new SafeNodeTestError('SUBSCRIPTION_RETURNED_HTML', '订阅地址返回了网页，链接可能已失效或需要登录。', 422)

    return content
  }

  throw new SafeNodeTestError('SUBSCRIPTION_FETCH_FAILED', '无法读取订阅。', 502)
}

const hashRateLimitKey = async (request: Request, subscriptionHost: string): Promise<string> => {
  const actor = request.headers.get('cf-connecting-ip')
    || request.headers.get('user-agent')?.slice(0, 160)
    || 'anonymous'
  const bytes = new TextEncoder().encode(`${actor}|${subscriptionHost}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

const probeTcp = async (node: ParsedNode): Promise<ProbeAttempt> => {
  if (isUnsafeHostname(node.server) || node.port === 25)
    return { ok: false, latencyMs: null, status: 'blocked' }

  const startedAt = performance.now()
  let socket: Socket | undefined
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let timedOut = false

  try {
    socket = connect({ hostname: node.server, port: node.port })

    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true
        reject(new Error('probe_timeout'))
      }, PROBE_TIMEOUT_MS)
    })

    await Promise.race([socket.opened, timeout])
    return {
      ok: true,
      latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
      status: 'online',
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : ''
    const blocked = message.includes('disallowed')
      || message.includes('not allowed')
      || message.includes('loop detected')
      || message.includes('prohibited')

    return {
      ok: false,
      latencyMs: null,
      status: blocked ? 'blocked' : timedOut ? 'timeout' : 'error',
    }
  }
  finally {
    if (timeoutId)
      clearTimeout(timeoutId)
    if (socket) {
      try {
        await socket.close()
      }
      catch {
        // The remote endpoint may close first; the probe result is already known.
      }
    }
  }
}

const probeNode = async (node: ParsedNode, index: number): Promise<NodeProbe> => {
  if (isUdpOnlyProtocol(node.type)) {
    return {
      id: index + 1,
      ...node,
      status: 'unsupported',
      latencyMs: null,
      fastestMs: null,
      successRate: 0,
      reason: 'UDP 协议暂不支持 TCP 探测',
    }
  }

  if (isUnsafeHostname(node.server) || node.port === 25) {
    return {
      id: index + 1,
      ...node,
      status: 'blocked',
      latencyMs: null,
      fastestMs: null,
      successRate: 0,
      reason: '安全策略已阻止该地址',
    }
  }

  const attempts: ProbeAttempt[] = []
  for (let attempt = 0; attempt < PROBE_ATTEMPTS; attempt += 1)
    attempts.push(await probeTcp(node))

  const successful = attempts.filter(attempt => attempt.ok && attempt.latencyMs !== null)
  const samples = successful.map(attempt => attempt.latencyMs as number)
  const fallbackStatus = attempts.find(attempt => attempt.status === 'blocked')?.status
    || attempts.find(attempt => attempt.status === 'timeout')?.status
    || 'error'

  return {
    id: index + 1,
    ...node,
    status: samples.length ? 'online' : fallbackStatus,
    latencyMs: samples.length
      ? Math.round(samples.reduce((total, latency) => total + latency, 0) / samples.length)
      : null,
    fastestMs: samples.length ? Math.min(...samples) : null,
    successRate: Math.round((samples.length / PROBE_ATTEMPTS) * 100),
    ...(samples.length ? {} : { reason: fallbackStatus === 'timeout' ? 'TCP 连接超时' : 'TCP 连接失败' }),
  }
}

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  const worker = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
}

const errorOutcome = (error: unknown): NodeTestOutcome => {
  if (error instanceof SafeNodeTestError) {
    return {
      data: { ok: false, code: error.code, error: error.message },
      init: { status: error.status },
    }
  }

  console.error(JSON.stringify({ message: 'node_test_failed' }))
  return {
    data: { ok: false, code: 'NODE_TEST_FAILED', error: '节点检测暂时失败，请稍后重试。' },
    init: { status: 500 },
  }
}

export const runNodeTest = async (request: Request, env: Env): Promise<NodeTestOutcome> => {
  const startedAt = performance.now()

  try {
    const subscriptionUrl = validateSubscriptionUrl(await parseRequest(request))
    const rateLimitKey = await hashRateLimitKey(request, subscriptionUrl.hostname)
    const rateLimit = await env.NODE_TEST_RATE_LIMITER.limit({ key: rateLimitKey })

    if (!rateLimit.success) {
      throw new SafeNodeTestError(
        'RATE_LIMITED',
        '检测请求过于频繁，请等待一分钟后再试。',
        429,
      )
    }

    const subscription = await fetchSubscription(subscriptionUrl)
    const parsedNodes = parseSubscriptionText(subscription)
    if (!parsedNodes.length) {
      throw new SafeNodeTestError(
        'NO_SUPPORTED_NODES',
        '没有解析到支持的节点，请确认订阅为 Clash、Base64 或常见 URI 格式。',
        422,
      )
    }

    const selectedNodes = parsedNodes.slice(0, MAX_NODES)
    const nodes = await mapWithConcurrency(selectedNodes, PROBE_CONCURRENCY, probeNode)
    const onlineNodes = nodes.filter(node => node.status === 'online')
    const testedNodes = nodes.filter(node => node.status !== 'unsupported')
    const averageLatencyMs = onlineNodes.length
      ? Math.round(onlineNodes.reduce((total, node) => total + (node.latencyMs || 0), 0) / onlineNodes.length)
      : null

    return {
      data: {
        ok: true,
        sourceHost: subscriptionUrl.hostname,
        edgeLocation: request.cf?.colo || 'unknown',
        totalNodes: parsedNodes.length,
        testedNodes: selectedNodes.length,
        truncated: parsedNodes.length > MAX_NODES,
        elapsedMs: Math.round(performance.now() - startedAt),
        summary: {
          online: onlineNodes.length,
          unavailable: testedNodes.length - onlineNodes.length,
          unsupported: nodes.length - testedNodes.length,
          averageLatencyMs,
        },
        nodes,
      },
    }
  }
  catch (error) {
    return errorOutcome(error)
  }
}
