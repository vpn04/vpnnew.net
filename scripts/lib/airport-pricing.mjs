// Read published tariff tables without treating annual equivalents or coupons as monthly prices.
export const cleanCell = value => String(value)
  .replace(/<br\s*\/?\s*>/gi, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/(?:\*\*|__|~~|`)/g, '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/\s+/g, ' ').trim()

const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '')
  .split(/(?<!\\)\|/).map(value => cleanCell(value.replace(/\\\|/g, '|')))
const positiveNumber = text => {
  const amounts = [...text.matchAll(/\d+(?:\.\d+)?/g)]
  if (amounts.length !== 1 || /\d+\.\d{3,}/.test(text)) return null
  const value = Number(amounts[0][0])
  return Number.isFinite(value) && value > 0 ? value : null
}
const dataAmount = text => {
  if (/不限|无限|待|确认|核对|每日|每天|\/\s*(?:\d+\s*)?(?:天|年|季|周)|每年|总流量|一次性/.test(text)) return null
  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(TB|GB|T|G)(?![a-z])/gi)]
  if (matches.length !== 1) return null
  const value = Number(matches[0][1]) * (/^T/i.test(matches[0][2]) ? 1000 : 1)
  return value > 0 ? value : null
}

export const readSummaryPricing = summary => {
  const text = cleanCell(summary)
  const price = text.match(/(?:[¥￥]\s*)?(\d+(?:\.\d+)?)\s*元?/)
  const flow = text.match(/\d+(?:\.\d+)?\s*(?:TB|GB|T|G)(?![a-z])\s*(?:\/\s*(?:每30天|每月|月|年|天)|每月|每30天)?/i)?.[0]
  const monthly = /每月|\/\s*(?:每月|月)/.test(text)
  const restricted = /年付|季付|半年|年、|年，|\/年|永久|一次性|折合|优惠|折后|折起|折）|折\)/.test(text)
  return {
    name: '原文入门套餐',
    monthlyPrice: monthly && !restricted && price ? Number(price[1]) : null,
    monthlyDataGB: flow && /每月|\/\s*(?:每月|月)/.test(flow) ? dataAmount(flow) : null,
    priceDisplay: text,
    dataDescription: /(?:流量不限|不限流量)/.test(text) ? '原文标注不限流量' : (flow || '原文未列明流量额度'),
  }
}

export const readReviewPricing = content => {
  const lines = content.split(/\r?\n/)
  const candidates = []
  for (let index = 0; index < lines.length - 2; index += 1) {
    if (!/^\s*\|/.test(lines[index]) || !/^\s*\|[\s:|\-]+$/.test(lines[index + 1])) continue
    const headers = cells(lines[index])
    const nameIndex = headers.findIndex(header => /套餐名称|套餐$|套餐等级|套餐类型/.test(header))
    // Prefer actual monthly payment or original price to any discounted/equivalent column.
    let priceIndex = headers.findIndex(header => /月付/.test(header) && !/均|折|连续|理论|后/.test(header))
    if (priceIndex < 0) priceIndex = headers.findIndex(header => /原价|价格|月费|费用/.test(header) && !/均|折|后|单价|每GB/.test(header))
    const dataIndex = headers.findIndex(header => /流量/.test(header) && !/单价|费用|成本/.test(header))
    const cycleIndex = headers.findIndex(header => /周期|付费方式/.test(header))
    const deviceIndex = headers.findIndex(header => /设备/.test(header))
    if (nameIndex < 0 || priceIndex < 0 || dataIndex < 0) continue
    for (let rowIndex = index + 2; rowIndex < lines.length && /^\s*\|/.test(lines[rowIndex]); rowIndex += 1) {
      const row = cells(lines[rowIndex])
      if (row.length !== headers.length) continue
      const originalPrice = row[priceIndex]
      const explicitMonthly = originalPrice.match(/(?:^|[｜;；])\s*月付\s*([¥￥]?\s*\d+(?:\.\d+)?\s*元?)/)
      const priceText = explicitMonthly ? `${explicitMonthly[1]}/月` : originalPrice
      const flow = row[dataIndex]
      const cycle = cycleIndex < 0 ? '' : row[cycleIndex]
      const name = row[headers.findIndex(header => /套餐名称/.test(header))] || row[nameIndex]
      if (!priceText || !flow || !/[¥￥元]|^\d+(?:\.\d+)?(?:\/月)?$/.test(priceText)) continue
      const cycleMonthly = /月付/.test(cycle)
      const annualOnly = /年付|季付|半年|年|一次性|永不|不限时/.test(cycle) && !cycleMonthly
      const nonMonthly = /一次性|永久|不限时|年付|季付|半年付|\/\s*(?:每?年|每?季|半年|周|天)|每年|每季|每周|折合|月均/.test(priceText)
        || annualOnly || /一次性|永久|不限时|六个月|三个月|包年|（年）/.test(row[0] + name)
        || /\/\s*\d+\s*天/.test(flow)
      const monthly = !nonMonthly && (/月付|月费/.test(headers[priceIndex]) || /\/\s*(?:每月|月)|每月/.test(priceText) || cycleMonthly)
      const price = monthly ? positiveNumber(priceText) : null
      const flowIsMonthly = /每月|每30天|\/\s*(?:每月|月)/.test(flow + headers[dataIndex]) || monthly
      candidates.push({
        name,
        monthlyPrice: price,
        monthlyDataGB: flowIsMonthly ? dataAmount(flow) : null,
        priceDisplay: `${priceText}${annualOnly && !/年|季|一次性|永久/.test(priceText) ? `（${cycle}）` : !monthly && cycle && /以官网为准/.test(cycle) ? `（${cycle}）` : ''}`,
        dataDescription: `${flow}${!flowIsMonthly && /以官网为准/.test(cycle) ? '（周期以官网为准）' : !flowIsMonthly && !/月|年|天|一次性|永久|不限时|以官网/.test(flow + cycle) ? '（周期未注明）' : ''}`,
        ...(deviceIndex < 0 ? {} : { deviceLimit: row[deviceIndex] }),
      })
    }
    // Later prose often repeats outdated summaries; use the first actual tariff table as one source.
    if (candidates.length) break
  }
  // A genuine monthly tier is the default card; preserve raw periods if no such tier exists.
  return candidates.filter(item => item.monthlyPrice !== null)
    .sort((left, right) => left.monthlyPrice - right.monthlyPrice)[0] || candidates[0]
}
