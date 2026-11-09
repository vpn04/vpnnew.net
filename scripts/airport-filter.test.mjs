import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import { readReviewPricing, readSummaryPricing } from './lib/airport-pricing.mjs'

// Use the project's TypeScript compiler so these tests also run on its supported Node 20/22 versions.
const compileTypeScriptUrl = async fileUrl => {
  const source = readFileSync(fileUrl, 'utf8')
  let compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  for (const match of [...compiled.matchAll(/\bfrom\s*(['"])(\.{1,2}\/[^'"]+)\1/g)]) {
    const specifier = match[2].endsWith('.ts') ? match[2] : `${match[2]}.ts`
    const dependency = await compileTypeScriptUrl(new URL(specifier, fileUrl))
    compiled = compiled.replace(match[0], `from '${dependency}'`)
  }
  return `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
}
const loadTypeScript = async relativePath => import(await compileTypeScriptUrl(new URL(relativePath, import.meta.url)))

const { getMatchingAirportPlans, getAirportFinderResults } = await loadTypeScript('../docs/.vuepress/theme/data/airportFilter.ts')
const { airportPlans, allAirportPlans, recommendedAirportIds, excludedAirportPaths } = await loadTypeScript('../docs/.vuepress/theme/data/airportCatalog.ts')
const { airportDirectory } = await loadTypeScript('../docs/.vuepress/theme/data/airportDirectory.generated.ts')
const { formatMonthlyPrice, formatMonthlyData, formatUnitPrice } = await loadTypeScript('../docs/.vuepress/theme/data/airportDisplay.ts')
const filters = changes => ({ budget: null, minDataGB: 0, query: '', sort: 'price', ...changes })
const plan = (id, airportId, monthlyPrice, monthlyDataGB, name = id) => ({
  id, airportId, airportName: airportId, name, monthlyPrice, monthlyDataGB,
  sourcePath: '/review/', sourceDate: '2026-11-01', deviceLimit: 'Unknown', note: '',
})
const examples = [
  plan('alpha-lite', 'Alpha', 5, 100, 'Lite'),
  plan('alpha-pro', 'Alpha', 10, 300, 'Pro'),
  plan('beta-lite', 'Beta', 8, 200, 'Lite'),
  plan('beta-pro', 'Beta', 20, 500, 'Pro'),
  plan('gamma', 'Gamma', 12, 1000, 'Standard'),
]

test('budget and data limits are inclusive; choose a qualifying tier before grouping', () => {
  const result = getMatchingAirportPlans(examples, filters({ budget: 10, minDataGB: 200 }))
  assert.deepEqual(result.map(item => item.id), ['beta-lite', 'alpha-pro'])
  assert.deepEqual(getMatchingAirportPlans(examples, filters({ budget: 10, minDataGB: 300 })).map(item => item.id), ['alpha-pro'])
})

test('one result per airport, with a higher data allowance winning equal prices', () => {
  const input = [...examples, plan('alpha-tie', 'Alpha', 5, 150)]
  const before = input.map(item => item.id)
  const result = getMatchingAirportPlans(input, filters())
  assert.equal(result.length, 3)
  assert.equal(result[0].id, 'alpha-tie')
  assert.deepEqual(input.map(item => item.id), before, 'filtering must not mutate the catalogue')
})

test('data sorting changes order without replacing the cheapest matching tier', () => {
  const result = getMatchingAirportPlans(examples, filters({ sort: 'data' }))
  assert.deepEqual(result.map(item => item.id), ['gamma', 'beta-lite', 'alpha-lite'])
})

test('search accepts case, full-width letters, multiple spaces and a plan-name term', () => {
  const result = getMatchingAirportPlans(examples, filters({ query: '  ＡＬＰＨＡ   pro ' }))
  assert.deepEqual(result.map(item => item.id), ['alpha-pro'])
})

test('unmatched requests and unknown allowances do not produce invented results', () => {
  assert.deepEqual(getMatchingAirportPlans(examples, filters({ budget: 1 })), [])
  assert.deepEqual(getMatchingAirportPlans(examples, filters({ query: 'not-in-catalogue' })), [])
  const invalid = [plan('unknown', 'Unknown', 1, Number.NaN), plan('infinite', 'Infinite', 1, Infinity)]
  assert.deepEqual(getMatchingAirportPlans(invalid, filters()), [])
})

test('missing numeric data remains comparable, but cannot pass an unknown numeric constraint', () => {
  const unknown = plan('unknown-card', 'Unknown', null, null)
  assert.deepEqual(getMatchingAirportPlans([unknown], filters()), [unknown])
  assert.deepEqual(getMatchingAirportPlans([unknown], filters({ query: 'unknown' })), [unknown])
  assert.deepEqual(getMatchingAirportPlans([unknown], filters({ budget: 30 })), [])
  assert.deepEqual(getMatchingAirportPlans([unknown], filters({ minDataGB: 100 })), [])
  const partial = plan('partial-card', 'Partial', 24, null)
  assert.deepEqual(getMatchingAirportPlans([partial], filters({ budget: 30 })), [partial])
  assert.deepEqual(getMatchingAirportPlans([partial], filters({ minDataGB: 100 })), [])
})

test('initial editorial view starts with the exact five requested airports', () => {
  assert.deepEqual([...recommendedAirportIds], ['xxyun', 'wangjikuaiche', 'dengta-accelerator', 'flybit', 'runway'])
  const result = getAirportFinderResults(allAirportPlans, filters({
    sort: 'recommended', recommendedOrder: recommendedAirportIds,
  }))
  assert.deepEqual(result.displayPlans.slice(0, 5).map(item => item.airportId), [...recommendedAirportIds])
  assert(result.matchingPlans.some(item => item.airportId === 'wangjikuaiche'))
  assert.equal(result.displayPlans.find(item => item.airportId === 'wangjikuaiche').monthlyDataGB, null)
})

test('editorial preference never bypasses price, data or search filters', () => {
  for (const changes of [{ budget: 5 }, { minDataGB: 200 }, { query: 'Andy' }]) {
    const result = getAirportFinderResults(allAirportPlans, filters({
      sort: 'recommended', recommendedOrder: recommendedAirportIds, ...changes,
    }))
    assert(result.displayPlans.every(item => changes.budget === undefined || (item.monthlyPrice !== null && item.monthlyPrice <= changes.budget)))
    assert(result.displayPlans.every(item => changes.minDataGB === undefined || (item.monthlyDataGB !== null && item.monthlyDataGB >= changes.minDataGB)))
  }
})

test('explicit price sorting keeps every airport and puts unknown monthly amounts last', () => {
  const result = getAirportFinderResults(allAirportPlans, filters({
    sort: 'price', recommendedOrder: recommendedAirportIds,
  }))
  assert.equal(result.displayPlans.length, result.matchingPlans.length)
  const prices = result.displayPlans.filter(item => item.monthlyPrice !== null).map(item => item.monthlyPrice)
  assert.deepEqual(prices, [...prices].sort((left, right) => left - right))
  const unknownIndex = result.displayPlans.findIndex(item => item.monthlyPrice === null)
  assert(result.displayPlans.slice(unknownIndex).every(item => item.monthlyPrice === null))
  assert.equal(result.displayPlans.length, airportDirectory.filter(item => !excludedAirportPaths.includes(item.sourcePath)).length)
})

const collectMarkdown = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  if (entry.name.startsWith('.')) return []
  const path = join(directory, entry.name)
  return entry.isDirectory() ? collectMarkdown(path) : entry.name.endsWith('.md') ? [path] : []
})

test('every catalogue card traces to its actual publication or editing date without inventing one', () => {
  const sources = new Map(collectMarkdown('docs').map(file => {
    const content = readFileSync(file, 'utf8')
    return [content.match(/^permalink:\s*([^\r\n]+)/m)?.[1].trim(), content]
  }))
  const ids = new Set()
  const providerSources = new Map()
  assert(airportPlans.length > 0)
  for (const item of allAirportPlans) {
    assert(!ids.has(item.id), `Duplicate plan ID: ${item.id}`)
    ids.add(item.id)
    assert(item.monthlyPrice === null || (Number.isFinite(item.monthlyPrice) && item.monthlyPrice > 0), item.id)
    if (airportPlans.some(known => known.id === item.id)) assert(Number.isFinite(item.monthlyDataGB) && item.monthlyDataGB > 0, item.id)
    assert(item.monthlyDataGB === null || (Number.isFinite(item.monthlyDataGB) && item.monthlyDataGB > 0), item.id)
    const source = sources.get(item.sourcePath)
    assert(source, `Missing source: ${item.sourcePath}`)
    const dateField = item.sourceDateKind === 'published' ? 'createTime' : 'updated'
    const datePattern = new RegExp(`^${dateField}:\\s*["']?(\\d{4}[-/]\\d{2}[-/]\\d{2})`, 'm')
    const actualDate = source.match(datePattern)?.[1].replaceAll('/', '-')
    assert.equal(item.sourceDate, actualDate, `Wrong ${dateField} date: ${item.id}`)
    assert(item.deviceLimit && item.note, `Missing limits or context: ${item.id}`)
    if (providerSources.has(item.airportId)) assert.equal(providerSources.get(item.airportId), item.sourcePath)
    providerSources.set(item.airportId, item.sourcePath)
  }
})

test('every included standalone airport review appears once in the default comparison directory', () => {
  const reviewFiles = [
    ...collectMarkdown('docs/blog/机场/机场详情'),
    ...collectMarkdown('docs/blog/机场/更新机场'),
  ]
  const reviewPaths = reviewFiles.map(file => readFileSync(file, 'utf8').match(/^permalink:\s*([^\r\n]+)/m)?.[1].trim())
    .filter(path => !excludedAirportPaths.includes(path))
  const result = getAirportFinderResults(allAirportPlans, filters({ sort: 'recommended', recommendedOrder: recommendedAirportIds }))
  assert.deepEqual([...new Set(result.displayPlans.map(item => item.sourcePath))].sort(), [...new Set(reviewPaths)].sort())
  assert.equal(result.displayPlans.length, reviewPaths.length)
  assert.equal(new Set(result.displayPlans.map(item => item.airportId)).size, reviewPaths.length)
  for (const item of result.displayPlans) {
    const found = getMatchingAirportPlans(allAirportPlans, filters({ query: item.airportName }))
    assert(found.some(candidate => candidate.airportId === item.airportId), `Not searchable: ${item.airportName}`)
  }
})

test('risk notices remain available without mislabeling recovered services as current shutdowns', () => {
  const find = path => allAirportPlans.find(item => item.sourcePath === path)
  assert.equal(find('/article/yinyun/').riskTone, 'warning')
  assert.equal(find('/article/feimaoyun/').riskTone, 'info')
  assert.equal(find('/article/dengtacloud/').riskTone, 'info')
  assert(find('/article/dengtacloud/').riskLabel.includes('解除'))
  for (const item of allAirportPlans.filter(entry => entry.riskLabel)) assert(item.riskPath, item.id)
})

test('removed airports stay absent from all finder orders and searches after regeneration', () => {
  assert.deepEqual([...excludedAirportPaths], ['/article/naiyun/', '/article/OKANC/'])
  assert(allAirportPlans.every(item => !excludedAirportPaths.includes(item.sourcePath)))
  for (const sort of ['recommended', 'price', 'data']) {
    const result = getAirportFinderResults(allAirportPlans, filters({ sort, recommendedOrder: recommendedAirportIds }))
    assert(result.displayPlans.every(item => !excludedAirportPaths.includes(item.sourcePath)))
    for (const query of ['奈云', 'OKANC']) {
      assert.deepEqual(getMatchingAirportPlans(allAirportPlans, filters({ sort, query })), [])
    }
  }
})

test('every public airport has source prices, flow and its corresponding official purchase URL', () => {
  const main = readFileSync('docs/blog/机场/2026年性价比翻墙机场推荐评测（长期更新）.md', 'utf8')
  for (const item of allAirportPlans) {
    assert(item.officialUrl, `Missing official URL: ${item.airportName}`)
    assert(['http:', 'https:'].includes(new URL(item.officialUrl).protocol))
    assert(main.includes(item.officialUrl), `Official URL differs from the article: ${item.airportName}`)
    assert(!formatMonthlyPrice(item).includes('未列明'), item.id)
    assert(!formatMonthlyData(item).includes('未列明'), item.id)
  }
  const find = path => allAirportPlans.find(item => item.sourcePath === path)
  assert.equal(find('/article/wangjikuaiche/').officialUrl, 'https://快车.com?c=SRNIQJ')
  assert.equal(new URL(find('/vpn/baoyun-airport-review-2026/').officialUrl).port, '8888')
  assert(find('/article/flybit/').officialUrl.startsWith('http://'))
  assert(find('/vpn/xinghua-cloud-review-2026/').officialUrl.endsWith('code=C7XOLH0H'))
})

test('raw annual, daily and conflicting source values remain visible without invented monthly amounts', () => {
  const find = path => allAirportPlans.find(item => item.sourcePath === path)
  assert.equal(find('/article/speedworld-review-2026/').monthlyPrice, null)
  assert.equal(formatMonthlyPrice(find('/article/speedworld-review-2026/')), '¥90/年')
  assert.match(formatMonthlyPrice(find('/article/dengtacloud/')), /年付/)
  const boundary = find('/vpn/yunjiexian-review-2026/')
  assert.equal(boundary.monthlyPrice, null)
  assert.match(formatMonthlyPrice(boundary), /22.*25/)
  assert.match(formatMonthlyData(find('/article/wangjikuaiche/')), /1500.*1800.*60GB/)
  assert.match(formatMonthlyData(find('/vpn/breezenet-review-2026/')), /200GB.*周期/)
  assert.match(formatMonthlyData(find('/article/edge-x-review-2026/')), /不限流量.*200GB/)
  assert.match(formatUnitPrice(boundary), /—/)
  assert.equal(find('/article/xsus/').monthlyPrice, 24)
  assert.equal(find('/vpn/twilight-accelerator-review-2026/').monthlyPrice, 20)
  assert.match(formatMonthlyData(find('/vpn/yuzhouyun-review-2026/')), /120G.*周期/)
})

test('tariff extraction respects billing cycles and uses the first detail table rather than a later summary', () => {
  const content = `| 套餐名称 | 可选周期 | 月费 | 流量 |
| --- | --- | --- | --- |
| 年付体验 | 年付 | ¥8/月 | 60GB/月 |
| 标准 | 月付、年付 | ¥20/月 | 1TB/月 |
| 体验 | 月付 | ¥2/月 | 3GB/3天 |

| 套餐名称 | 月费 | 流量 |
| --- | --- | --- |
| 旧摘要 | ¥1/月 | 2TB/月 |`
  const result = readReviewPricing(content)
  assert.equal(result.monthlyPrice, 20)
  assert.equal(result.monthlyDataGB, 1000)
  const annual = readSummaryPricing('96元/年、60GB/月（折合8元/月）')
  assert.equal(annual.monthlyPrice, null)
  assert.equal(annual.monthlyDataGB, 60)
  assert.match(annual.priceDisplay, /96元\/年/)
})
