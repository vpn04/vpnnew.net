import type { AirportPlan } from './airportCatalog'

export type AirportSort = 'recommended' | 'price' | 'data'

export interface AirportFilters {
  budget: number | null
  minDataGB: number
  query: string
  sort: AirportSort
  recommendedOrder?: readonly string[]
}

const compareNullablePrice = (left: number | null, right: number | null): number =>
  left === right ? 0 : left === null ? 1 : right === null ? -1 : left - right

const comparePrice = (left: AirportPlan, right: AirportPlan): number =>
  compareNullablePrice(left.monthlyPrice, right.monthlyPrice)
  || (right.monthlyDataGB ?? 0) - (left.monthlyDataGB ?? 0)
  || left.id.localeCompare(right.id)

const normalizeSearch = (value: string): string => value.normalize('NFKC').toLowerCase().trim()

const sortPlans = (plans: readonly AirportPlan[], filters: AirportFilters): AirportPlan[] => {
  const positions = new Map((filters.recommendedOrder || []).map((id, index) => [id, index]))
  return [...plans].sort((left, right) => {
    if (filters.sort === 'recommended') {
      const priority = (positions.get(left.airportId) ?? Number.MAX_SAFE_INTEGER)
        - (positions.get(right.airportId) ?? Number.MAX_SAFE_INTEGER)
      if (priority) return priority
    }
    if (filters.sort === 'data') {
      const allowance = (right.monthlyDataGB ?? 0) - (left.monthlyDataGB ?? 0)
      if (allowance) return allowance
    }
    return comparePrice(left, right)
  })
}

/** Keep the cheapest qualifying plan for each airport, rather than its cheapest plan overall. */
export const getMatchingAirportPlans = (
  plans: readonly AirportPlan[],
  filters: AirportFilters,
): AirportPlan[] => {
  const terms = normalizeSearch(filters.query).split(/\s+/).filter(Boolean)
  const matchingByAirport = new Map<string, AirportPlan>()

  for (const plan of plans) {
    if (
      (plan.monthlyPrice !== null && (!Number.isFinite(plan.monthlyPrice) || plan.monthlyPrice <= 0))
      || (plan.monthlyDataGB !== null && (!Number.isFinite(plan.monthlyDataGB) || plan.monthlyDataGB <= 0))
      || (filters.budget !== null && (plan.monthlyPrice === null || plan.monthlyPrice > filters.budget))
      || (filters.minDataGB > 0 && (plan.monthlyDataGB === null || plan.monthlyDataGB < filters.minDataGB))
    ) continue

    const searchable = normalizeSearch(`${plan.airportName} ${plan.name}`)
    if (!terms.every(term => searchable.includes(term))) continue

    const previous = matchingByAirport.get(plan.airportId)
    if (!previous || comparePrice(plan, previous) < 0) {
      matchingByAirport.set(plan.airportId, plan)
    }
  }

  return sortPlans(Array.from(matchingByAirport.values()), filters)
}

/** All cards may be compared. Unknown numeric fields only fail a corresponding numeric filter. */
export const getAirportFinderResults = (
  plans: readonly AirportPlan[],
  filters: AirportFilters,
): { matchingPlans: AirportPlan[], displayPlans: AirportPlan[] } => {
  const matchingPlans = getMatchingAirportPlans(plans, filters)
  return {
    matchingPlans,
    displayPlans: matchingPlans,
  }
}
