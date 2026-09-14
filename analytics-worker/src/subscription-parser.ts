export type ParsedNode = {
  name: string
  type: string
  server: string
  port: number
}

const URI_PATTERN = /^(ss|ssr|vmess|vless|trojan|anytls|hysteria|hysteria2|hy2|tuic|socks|socks5|http|https):\/\//i
const UDP_PROTOCOLS = new Set(['hysteria', 'hysteria2', 'hy2', 'tuic'])

const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value)
  }
  catch {
    return value
  }
}

const decodeBase64 = (value: string): string | undefined => {
  const normalized = value
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  if (!normalized || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized))
    return undefined

  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')

  try {
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  }
  catch {
    return undefined
  }
}

const cleanName = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string')
    return fallback

  const name = value
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return name.slice(0, 100) || fallback
}

const normalizeHostname = (value: string): string =>
  value.trim().replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase()

const toPort = (value: unknown): number | undefined => {
  const port = typeof value === 'number' ? value : Number(String(value || '').trim())
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : undefined
}

const createNode = (
  type: string,
  server: unknown,
  portValue: unknown,
  name: unknown,
  fallbackName: string,
): ParsedNode | undefined => {
  if (typeof server !== 'string')
    return undefined

  const hostname = normalizeHostname(server)
  const port = toPort(portValue)

  if (!hostname || !port)
    return undefined

  return {
    name: cleanName(name, fallbackName),
    type: type.toLowerCase() === 'hy2' ? 'hysteria2' : type.toLowerCase(),
    server: hostname,
    port,
  }
}

const parseGenericUri = (line: string, index: number): ParsedNode | undefined => {
  try {
    const url = new URL(line)
    const type = url.protocol.replace(':', '').toLowerCase()
    const name = safeDecodeURIComponent(url.hash.replace(/^#/, ''))
    return createNode(type, url.hostname, url.port, name, `${type.toUpperCase()} 节点 ${index + 1}`)
  }
  catch {
    return undefined
  }
}

const parseVmessUri = (line: string, index: number): ParsedNode | undefined => {
  const payload = line.slice('vmess://'.length).split('#', 1)[0]
  const decoded = decodeBase64(payload)
  if (!decoded)
    return undefined

  try {
    const config = JSON.parse(decoded) as Record<string, unknown>
    return createNode('vmess', config.add, config.port, config.ps, `VMess 节点 ${index + 1}`)
  }
  catch {
    return undefined
  }
}

const parseShadowsocksUri = (line: string, index: number): ParsedNode | undefined => {
  const direct = parseGenericUri(line, index)
  if (direct)
    return direct

  const withoutScheme = line.slice('ss://'.length)
  const hashIndex = withoutScheme.indexOf('#')
  const encodedPart = (hashIndex >= 0 ? withoutScheme.slice(0, hashIndex) : withoutScheme).split('?', 1)[0]
  const name = hashIndex >= 0
    ? safeDecodeURIComponent(withoutScheme.slice(hashIndex + 1))
    : ''
  const decoded = decodeBase64(encodedPart)
  if (!decoded)
    return undefined

  const address = decoded.match(/@(\[[^\]]+\]|[^:]+):(\d+)$/)
  if (!address)
    return undefined

  return createNode('ss', address[1], address[2], name, `SS 节点 ${index + 1}`)
}

const parseShadowsocksRUri = (line: string, index: number): ParsedNode | undefined => {
  const decoded = decodeBase64(line.slice('ssr://'.length).split('#', 1)[0])
  if (!decoded)
    return undefined

  const main = decoded.split('/?', 1)[0]
  const match = main.match(/^(\[[^\]]+\]|.+?):(\d+):[^:]+:[^:]+:[^:]+:/)
  if (!match)
    return undefined

  let name = ''
  const remarks = decoded.match(/[?&]remarks=([^&]+)/)
  if (remarks?.[1])
    name = decodeBase64(remarks[1]) || ''

  return createNode('ssr', match[1], match[2], name, `SSR 节点 ${index + 1}`)
}

const parseUriLine = (line: string, index: number): ParsedNode | undefined => {
  const scheme = line.slice(0, line.indexOf('://')).toLowerCase()

  if (scheme === 'vmess')
    return parseVmessUri(line, index)
  if (scheme === 'ss')
    return parseShadowsocksUri(line, index)
  if (scheme === 'ssr')
    return parseShadowsocksRUri(line, index)

  return parseGenericUri(line, index)
}

const parseUriList = (text: string): ParsedNode[] => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => URI_PATTERN.test(line))

  return lines
    .map(parseUriLine)
    .filter((node): node is ParsedNode => Boolean(node))
}

const parseYamlScalar = (value: string): string => {
  const trimmed = value.trim()

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string
    }
    catch {
      return trimmed.slice(1, -1)
    }
  }

  if (trimmed.startsWith('\'') && trimmed.endsWith('\''))
    return trimmed.slice(1, -1).replace(/\'\'/g, '\'')

  return trimmed.replace(/\s+#.*$/, '').trim()
}

const setYamlField = (record: Record<string, string>, content: string): void => {
  const field = content.match(/^([\w-]+)\s*:\s*(.+)$/)
  if (!field)
    return

  const key = field[1].toLowerCase()
  if (['name', 'type', 'server', 'port'].includes(key))
    record[key] = parseYamlScalar(field[2])
}

const parseFlowYaml = (content: string): Record<string, string> => {
  const record: Record<string, string> = {}
  const fieldPattern = /(?:^|,)\s*(name|type|server|port)\s*:\s*("(?:\\.|[^"])*"|'(?:''|[^'])*'|[^,}]+)/gi

  for (const match of content.replace(/^\{\s*|\s*\}$/g, '').matchAll(fieldPattern))
    record[match[1].toLowerCase()] = parseYamlScalar(match[2])

  return record
}

const parseClashYaml = (text: string): ParsedNode[] => {
  const lines = text.split(/\r?\n/)
  const headerIndex = lines.findIndex(line => /^\s*proxies\s*:\s*$/.test(line))
  if (headerIndex < 0)
    return []

  const headerIndent = lines[headerIndex].match(/^\s*/)?.[0].length || 0
  const records: Array<Record<string, string>> = []
  let current: Record<string, string> | undefined

  const pushCurrent = (): void => {
    if (current)
      records.push(current)
    current = undefined
  }

  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#'))
      continue

    const indent = line.match(/^\s*/)?.[0].length || 0
    if (indent <= headerIndent && !trimmed.startsWith('-'))
      break

    const item = line.match(/^\s*-\s*(.*)$/)
    if (item) {
      pushCurrent()
      current = item[1].trim().startsWith('{')
        ? parseFlowYaml(item[1].trim())
        : {}
      if (!item[1].trim().startsWith('{'))
        setYamlField(current, item[1])
      continue
    }

    if (current)
      setYamlField(current, trimmed)
  }

  pushCurrent()

  return records
    .map((record, index) => createNode(
      record.type || 'unknown',
      record.server,
      record.port,
      record.name,
      `节点 ${index + 1}`,
    ))
    .filter((node): node is ParsedNode => Boolean(node))
}

const parseJsonSubscription = (text: string): ParsedNode[] => {
  if (!text.trim().startsWith('{'))
    return []

  try {
    const data = JSON.parse(text) as { proxies?: unknown }
    if (!Array.isArray(data.proxies))
      return []

    return data.proxies
      .map((item, index) => {
        if (!item || typeof item !== 'object')
          return undefined

        const proxy = item as Record<string, unknown>
        return createNode(
          typeof proxy.type === 'string' ? proxy.type : 'unknown',
          proxy.server,
          proxy.port,
          proxy.name,
          `节点 ${index + 1}`,
        )
      })
      .filter((node): node is ParsedNode => Boolean(node))
  }
  catch {
    return []
  }
}

const decodeSubscriptionDocument = (text: string): string => {
  const trimmed = text.replace(/^\uFEFF/, '').trim()
  if (trimmed.includes('://') || /(^|\n)\s*proxies\s*:/.test(trimmed) || trimmed.startsWith('{'))
    return trimmed

  const decoded = decodeBase64(trimmed)
  return decoded && (decoded.includes('://') || /(^|\n)\s*proxies\s*:/.test(decoded))
    ? decoded.trim()
    : trimmed
}

export const parseSubscriptionText = (text: string): ParsedNode[] => {
  const document = decodeSubscriptionDocument(text)
  const parsed = [
    ...parseJsonSubscription(document),
    ...parseClashYaml(document),
    ...parseUriList(document),
  ]
  const deduplicated = new Map<string, ParsedNode>()

  for (const node of parsed) {
    // Providers often publish several named routes that share the same entry
    // server and port. Keep those routes as separate rows while still removing
    // an exact duplicate produced by overlapping subscription formats.
    const key = `${node.name}|${node.type}|${node.server}|${node.port}`
    if (!deduplicated.has(key))
      deduplicated.set(key, node)
  }

  return [...deduplicated.values()]
}

const isPrivateIpv4 = (hostname: string): boolean => {
  if (!/^\d+(?:\.\d+){3}$/.test(hostname))
    return false

  const octets = hostname.split('.')
  if (octets.some(octet => !/^(?:0|[1-9]\d{0,2})$/.test(octet)))
    return true

  const parts = octets.map(Number)
  if (parts.some(part => part < 0 || part > 255))
    return true

  const [first, second, third] = parts
  return first === 0
    || first === 10
    || first === 127
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 0 && third === 0)
    || (first === 192 && second === 0 && third === 2)
    || (first === 192 && second === 168)
    || (first === 198 && (second === 18 || second === 19))
    || (first === 198 && second === 51 && third === 100)
    || (first === 203 && second === 0 && third === 113)
    || first >= 224
}

const isPrivateIpv6 = (hostname: string): boolean => {
  if (!hostname.includes(':'))
    return false

  let value: string
  try {
    value = new URL(`http://[${hostname}]/`).hostname.replace(/^\[|\]$/g, '').toLowerCase()
  }
  catch {
    return true
  }

  return value === '::'
    || value === '::1'
    || value.startsWith('::ffff:')
    || value.startsWith('fc')
    || value.startsWith('fd')
    || /^fe[89ab]/.test(value)
    || value.startsWith('ff')
    || value === '2001:db8'
    || value.startsWith('2001:db8:')
}

export const isUnsafeHostname = (value: string): boolean => {
  const hostname = normalizeHostname(value)

  if (!hostname || hostname.length > 253)
    return true

  if (/^\d+$/.test(hostname) || /^0x[\da-f]+$/i.test(hostname))
    return true

  if (
    hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || hostname.endsWith('.internal')
    || hostname.endsWith('.home')
    || hostname.endsWith('.lan')
    || hostname === 'test'
    || hostname.endsWith('.test')
    || hostname === 'example'
    || hostname.endsWith('.example')
    || hostname === 'invalid'
    || hostname.endsWith('.invalid')
    || (!hostname.includes('.') && !hostname.includes(':'))
  )
    return true

  return isPrivateIpv4(hostname) || isPrivateIpv6(hostname)
}

export const isUdpOnlyProtocol = (type: string): boolean => UDP_PROTOCOLS.has(type.toLowerCase())
