import type { AirportPlan } from './airportCatalog'

export const formatMoney = (amount: number): string => amount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
export const formatData = (amount: number | null): string => amount === null ? '原文未列明' : amount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
export const formatMonthlyPrice = (plan: AirportPlan): string => plan.monthlyPrice === null
  ? (plan.priceDisplay || plan.priceDescription || '原文未列明价格')
  : `¥${formatMoney(plan.monthlyPrice)} / 月`
export const formatMonthlyData = (plan: AirportPlan): string => plan.monthlyDataGB === null
  ? (plan.dataDescription || '原文未列明流量额度')
  : `${formatData(plan.monthlyDataGB)} GB / 月`
export const formatUnitPrice = (plan: AirportPlan): string => plan.monthlyPrice === null || plan.monthlyDataGB === null
  ? '—（周期或额度不统一）'
  : `约 ¥${(plan.monthlyPrice / plan.monthlyDataGB).toLocaleString('zh-CN', { minimumFractionDigits: 3, maximumFractionDigits: 4 })} / GB`
