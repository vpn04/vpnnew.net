type Env = {
  DB: D1Database
  ALLOWED_ORIGIN?: string
  TIME_ZONE?: string
}

type ViewPayload = {
  path?: string
  title?: string
  referrer?: string
}

type PagesPayload = {
  paths?: unknown
}

type Periods = {
  day: string
  month: string
  year: string
  now: string
}

type PageMetric = {
  path: string
  title: string
  total: number
  today: number
  month: number
  year: number
}

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
}

const BOT_UA = /\b(bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|embedly|quora link preview)\b/i

const createCorsHeaders = (request: Request, env: Env): HeadersInit => {
  const origin = request.headers.get('origin') || ''
  const allowedOrigins = (env.ALLOWED_ORIGIN || '*')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  const allowOrigin = allowedOrigins.includes('*')
    ? '*'
    : allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0] || '*'

  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

const json = (request: Request, env: Env, data: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...createCorsHeaders(request, env),
      ...init.headers,
    },
  })

const normalizePath = (value: unknown): string | undefined => {
  if (typeof value !== 'string')
    return undefined

  try {
    const url = new URL(value, 'https://vpnnew.net')
    const path = decodeURI(url.pathname)

    if (!path.startsWith('/') || path.length > 320)
      return undefined

    return path
  }
  catch {
    return undefined
  }
}

const normalizeTitle = (value: unknown): string => {
  if (typeof value !== 'string')
    return ''

  return value.replace(/\s+/g, ' ').trim().slice(0, 180)
}

const getPeriods = (timeZone = 'Asia/Shanghai'): Periods => {
  const date = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find(part => part.type === 'year')?.value || String(date.getUTCFullYear())
  const month = parts.find(part => part.type === 'month')?.value || String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = parts.find(part => part.type === 'day')?.value || String(date.getUTCDate()).padStart(2, '0')

  return {
    day: `${year}-${month}-${day}`,
    month: `${year}-${month}`,
    year,
    now: date.toISOString(),
  }
}

const toNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

const getPageMetric = async (env: Env, path: string, periods: Periods): Promise<PageMetric> => {
  const [page, today, month, year] = await Promise.all([
    env.DB.prepare('SELECT path, title, total_views FROM pages WHERE path = ?').bind(path).first(),
    env.DB.prepare('SELECT views FROM page_views_daily WHERE day = ? AND path = ?').bind(periods.day, path).first(),
    env.DB.prepare('SELECT views FROM page_views_monthly WHERE month = ? AND path = ?').bind(periods.month, path).first(),
    env.DB.prepare('SELECT views FROM page_views_yearly WHERE year = ? AND path = ?').bind(periods.year, path).first(),
  ])

  return {
    path,
    title: typeof page?.title === 'string' ? page.title : '',
    total: toNumber(page?.total_views),
    today: toNumber(today?.views),
    month: toNumber(month?.views),
    year: toNumber(year?.views),
  }
}

const recordView = async (request: Request, env: Env): Promise<Response> => {
  const userAgent = request.headers.get('user-agent') || ''
  const payload = await request.json().catch(() => ({})) as ViewPayload
  const path = normalizePath(payload.path)

  if (!path)
    return json(request, env, { ok: false, error: 'Invalid path' }, { status: 400 })

  const periods = getPeriods(env.TIME_ZONE)
  const title = normalizeTitle(payload.title)

  if (!BOT_UA.test(userAgent)) {
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO pages (path, title, total_views, first_seen, last_seen)
        VALUES (?, ?, 1, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
          title = CASE WHEN excluded.title != '' THEN excluded.title ELSE pages.title END,
          total_views = pages.total_views + 1,
          last_seen = excluded.last_seen
      `).bind(path, title, periods.now, periods.now),
      env.DB.prepare(`
        INSERT INTO page_views_daily (day, path, views)
        VALUES (?, ?, 1)
        ON CONFLICT(day, path) DO UPDATE SET views = page_views_daily.views + 1
      `).bind(periods.day, path),
      env.DB.prepare(`
        INSERT INTO page_views_monthly (month, path, views)
        VALUES (?, ?, 1)
        ON CONFLICT(month, path) DO UPDATE SET views = page_views_monthly.views + 1
      `).bind(periods.month, path),
      env.DB.prepare(`
        INSERT INTO page_views_yearly (year, path, views)
        VALUES (?, ?, 1)
        ON CONFLICT(year, path) DO UPDATE SET views = page_views_yearly.views + 1
      `).bind(periods.year, path),
    ])
  }

  const page = await getPageMetric(env, path, periods)

  return json(request, env, {
    ok: true,
    page,
  })
}

const getPages = async (request: Request, env: Env): Promise<Response> => {
  const payload = await request.json().catch(() => ({})) as PagesPayload
  const rawPaths = Array.isArray(payload.paths) ? payload.paths : []
  const paths = Array.from(new Set(rawPaths.map(normalizePath).filter((path): path is string => Boolean(path)))).slice(0, 60)
  const periods = getPeriods(env.TIME_ZONE)

  if (!paths.length) {
    return json(request, env, {
      ok: true,
      pages: [],
    })
  }

  const pages = await Promise.all(paths.map(path => getPageMetric(env, path, periods)))

  return json(request, env, {
    ok: true,
    pages,
  })
}

const getScalar = async (env: Env, sql: string, value?: string): Promise<number> => {
  const statement = value ? env.DB.prepare(sql).bind(value) : env.DB.prepare(sql)
  const row = await statement.first<{ views: number }>()
  return toNumber(row?.views)
}

const getTopPages = async (
  env: Env,
  table: 'page_views_daily' | 'page_views_monthly' | 'page_views_yearly' | 'pages',
  periodColumn: 'day' | 'month' | 'year' | undefined,
  periodValue: string | undefined,
  limit: number,
) => {
  if (table === 'pages') {
    const rows = await env.DB.prepare(`
      SELECT path, title, total_views AS views, total_views AS total
      FROM pages
      ORDER BY total_views DESC
      LIMIT ?
    `).bind(limit).all()

    return rows.results || []
  }

  const rows = await env.DB.prepare(`
    SELECT stats.path, COALESCE(pages.title, stats.path) AS title, stats.views, COALESCE(pages.total_views, stats.views) AS total
    FROM ${table} AS stats
    LEFT JOIN pages ON pages.path = stats.path
    WHERE stats.${periodColumn} = ?
    ORDER BY stats.views DESC
    LIMIT ?
  `).bind(periodValue, limit).all()

  return rows.results || []
}

const getSummary = async (request: Request, env: Env): Promise<Response> => {
  const url = new URL(request.url)
  const periods = getPeriods(env.TIME_ZONE)
  const requestedLimit = Number(url.searchParams.get('limit') || 12)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 60)
    : 12

  const [
    total,
    today,
    month,
    year,
    topToday,
    topMonth,
    topYear,
    topAll,
  ] = await Promise.all([
    getScalar(env, 'SELECT COALESCE(SUM(total_views), 0) AS views FROM pages'),
    getScalar(env, 'SELECT COALESCE(SUM(views), 0) AS views FROM page_views_daily WHERE day = ?', periods.day),
    getScalar(env, 'SELECT COALESCE(SUM(views), 0) AS views FROM page_views_monthly WHERE month = ?', periods.month),
    getScalar(env, 'SELECT COALESCE(SUM(views), 0) AS views FROM page_views_yearly WHERE year = ?', periods.year),
    getTopPages(env, 'page_views_daily', 'day', periods.day, limit),
    getTopPages(env, 'page_views_monthly', 'month', periods.month, limit),
    getTopPages(env, 'page_views_yearly', 'year', periods.year, limit),
    getTopPages(env, 'pages', undefined, undefined, limit),
  ])

  return json(request, env, {
    ok: true,
    generatedAt: periods.now,
    site: {
      total,
      today,
      month,
      year,
    },
    top: {
      today: topToday,
      month: topMonth,
      year: topYear,
      all: topAll,
    },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS')
      return new Response(null, { headers: createCorsHeaders(request, env) })

    const url = new URL(request.url)

    try {
      if (request.method === 'POST' && url.pathname.endsWith('/view'))
        return await recordView(request, env)

      if (request.method === 'POST' && url.pathname.endsWith('/pages'))
        return await getPages(request, env)

      if (request.method === 'GET' && url.pathname.endsWith('/summary'))
        return await getSummary(request, env)

      return json(request, env, { ok: false, error: 'Not found' }, { status: 404 })
    }
    catch (error) {
      console.error(JSON.stringify({
        message: 'analytics_worker_error',
        error: error instanceof Error ? error.message : String(error),
      }))

      return json(request, env, { ok: false, error: 'Internal error' }, { status: 500 })
    }
  },
}
