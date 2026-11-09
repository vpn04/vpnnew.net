import { airportDirectory } from './airportDirectory.generated'

export interface AirportPlan {
  id: string
  airportId: string
  airportName: string
  name: string
  monthlyPrice: number | null
  monthlyDataGB: number | null
  priceDisplay?: string
  officialUrl?: string
  priceDescription?: string
  dataDescription?: string
  sourcePath: string
  sourceDate: string
  sourceDateKind?: 'updated' | 'published'
  deviceLimit: string
  note: string
  riskLabel?: string
  riskPath?: string
  riskTone?: 'warning' | 'info'
}

// 本目录整理日期，不代表当天访问官网、核价或完成节点测试。
export const catalogUpdated = '2026-11-09'

// Explicit removals from the public finder; keep historical review and warning pages intact.
export const excludedAirportPaths = ['/article/naiyun/', '/article/OKANC/'] as const
const excludedSources = new Set<string>(excludedAirportPaths)

export const recommendedAirportIds = [
  'xxyun',
  'wangjikuaiche',
  'dengta-accelerator',
  'flybit',
  'runway',
] as const

type AirportSource = Omit<AirportPlan, 'id' | 'name' | 'monthlyPrice' | 'monthlyDataGB'>

// sourceDateKind 缺省为 updated；只有发布日期的文章明确标 published。
// sourceDate 取原文对应日期，不把目录整理日作为核价或文章编辑日。
// 仅收录原文明示的人民币月付及月度额度；不计优惠码或长周期折合价。
// monthlyDataGB 为月付套餐标注额度；每30天重置的原始口径保留在 note。
const sources = {
  xxyun: {
    airportId: 'xxyun',
    airportName: 'XXYUN',
    sourcePath: '/article/XXYUN/',
    sourceDate: '2025-10-21',
    sourceDateKind: 'published',
    deviceLimit: '原文标注不限设备',
    note: '仅收录主文与详情一致的月付档；原文较早，设备及共享口径待确认。',
  },
  flybit: {
    airportId: 'flybit',
    airportName: 'flybit机场',
    sourcePath: '/article/flybit/',
    sourceDate: '2025-11-26',
    sourceDateKind: 'published',
    deviceLimit: '待确认',
    note: '按详细套餐表整理；主文顶部11元50GB摘要不同，现价待核。',
  },
  runway: {
    airportId: 'runway',
    airportName: '拼好连机场',
    sourcePath: '/blog/runway/',
    sourceDate: '2026-06-30',
    sourceDateKind: 'published',
    deviceLimit: '原文标注不限客户端连接数',
    note: '按详细套餐表整理；现价及共享规则待核。',
  },
  dengta: {
    airportId: 'dengta-accelerator',
    airportName: '灯塔加速器',
    sourcePath: '/vpn/dengta-accelerator-review-2026/',
    sourceDate: '2026-09-02',
    deviceLimit: '待确认',
    note: '原文为公测资料；价格及条款以App内结算页为准。',
  },
  shenxing: {
    airportId: 'shenxing',
    airportName: '神行加速',
    sourcePath: '/vpn/shenxing-accelerator-review-2026/',
    sourceDate: '2026-10-10',
    deviceLimit: '待确认',
    note: '通用订阅需找客服领取；倍率与设备规则待确认。',
  },
  shandianshu: {
    airportId: 'shandianshu',
    airportName: '闪电鼠机场',
    sourcePath: '/vpn/shandianshu-airport-review-2026/',
    sourceDate: '2026-10-11',
    deviceLimit: '原文标注不限设备',
    note: '按每30天重置；通用订阅待开放，在线IP与共享规则待确认。',
  },
  dalaoyun: {
    airportId: 'dalaoyun',
    airportName: '大佬云机场',
    sourcePath: '/vpn/dalaoyun-airport-review-2026/',
    sourceDate: '2026-10-11',
    deviceLimit: '原文标注不限设备',
    note: '通用订阅待开放；在线IP与共享规则待确认，一次性套餐未收录。',
  },
  jiuyun: {
    airportId: 'jiuyun',
    airportName: '九云机场',
    sourcePath: '/vpn/jiuyun-airport-review-2026/',
    sourceDate: '2026-09-02',
    deviceLimit: '3台同时在线',
    note: '原文标注每30天刷新；倍率与设备判定方式待确认。',
  },
  baoyun: {
    airportId: 'baoyun',
    airportName: '宝云机场',
    sourcePath: '/vpn/baoyun-airport-review-2026/',
    sourceDate: '2026-09-13',
    deviceLimit: '待确认',
    note: '月度额度据原文；设备数、倍率、限速及具体重置日期待确认。',
  },
  civetnet: {
    airportId: 'civetnet',
    airportName: '灵猫机场',
    sourcePath: '/vpn/civetnet-review-2026/',
    sourceDate: '2026-10-10',
    deviceLimit: '待确认',
    note: '通用订阅需向客服索取；格式及设备规则待确认。',
  },
  liulianyun: {
    airportId: 'liulianyun',
    airportName: '榴莲云机场',
    sourcePath: '/vpn/liulianyun-review-2026/',
    sourceDate: '2026-10-10',
    deviceLimit: '待确认',
    note: '仅计月付原价；设备、倍率、退款及订阅格式需先确认。',
  },
  huanqiuti: {
    airportId: 'huanqiuti',
    airportName: '环球梯机场',
    sourcePath: '/vpn/huanqiuti-review-2026/',
    sourceDate: '2026-10-10',
    deviceLimit: '待确认',
    note: '不支持通用订阅；需先确认可用客户端与设备判定方式。',
  },
  xinghua: {
    airportId: 'xinghua-cloud',
    airportName: '杏花云机场',
    sourcePath: '/vpn/xinghua-cloud-review-2026/',
    sourceDate: '2026-10-10',
    deviceLimit: '待确认',
    note: '仅收录月付档；设备按安装数、在线数或IP计数的口径待确认。',
  },
  andy: {
    airportId: 'andy-cloud',
    airportName: 'Andy Cloud',
    sourcePath: '/vpn/andy-cloud-review-2026/',
    sourceDate: '2026-10-10',
    deviceLimit: '待确认',
    note: '通用订阅具体格式、设备判定及节点倍率需先确认。',
  },
  yuntu: {
    airportId: 'yuntu',
    airportName: '云图专线机场',
    sourcePath: '/vpn/yuntu-airport-review-2026/',
    sourceDate: '2026-09-01',
    deviceLimit: '5台同时在线',
    note: '需兼容AnyTLS；原文标注1倍，售出不退款，条款以购买页为准。',
  },
} satisfies Record<string, AirportSource>

export const airportPlans: AirportPlan[] = [
  {
    ...sources.xxyun, id: 'xxyun-basic', name: '初级套餐',
    monthlyPrice: 9.99, monthlyDataGB: 100,
  },
  {
    ...sources.xxyun, id: 'xxyun-standard', name: '中级套餐',
    monthlyPrice: 19.9, monthlyDataGB: 300,
  },
  {
    ...sources.xxyun, id: 'xxyun-advanced', name: '高级套餐',
    monthlyPrice: 39.9, monthlyDataGB: 1000,
  },
  {
    ...sources.flybit, id: 'flybit-monthly-100', name: '每月-100G',
    monthlyPrice: 12, monthlyDataGB: 100,
  },
  {
    ...sources.flybit, id: 'flybit-monthly-160', name: '每月-160G',
    monthlyPrice: 18, monthlyDataGB: 160,
  },
  {
    ...sources.flybit, id: 'flybit-monthly-220', name: '每月-220G',
    monthlyPrice: 24, monthlyDataGB: 220,
  },
  {
    ...sources.flybit, id: 'flybit-monthly-400', name: '每月-400G',
    monthlyPrice: 36, monthlyDataGB: 400,
  },
  {
    ...sources.runway, id: 'runway-trial', name: '天天尝鲜拼',
    monthlyPrice: 9.9, monthlyDataGB: 100,
  },
  {
    ...sources.runway, id: 'runway-popular', name: '万人好评拼',
    monthlyPrice: 19.9, monthlyDataGB: 200,
  },
  {
    ...sources.runway, id: 'runway-premium', name: '至尊金牌拼',
    monthlyPrice: 50, monthlyDataGB: 600,
  },
  {
    ...sources.dengta, id: 'dengta-light', name: '轻量',
    monthlyPrice: 30, monthlyDataGB: 120, deviceLimit: '3台同时在线',
  },
  {
    ...sources.dengta, id: 'dengta-vip', name: 'VIP',
    monthlyPrice: 68, monthlyDataGB: 300, deviceLimit: '3台同时在线',
  },
  {
    ...sources.dengta, id: 'dengta-svip', name: 'SVIP',
    monthlyPrice: 138, monthlyDataGB: 800, deviceLimit: '6台同时在线',
  },
  {
    ...sources.shenxing, id: 'shenxing-trial', name: '神行·尝鲜包',
    monthlyPrice: 23, monthlyDataGB: 120,
  },
  {
    ...sources.shenxing, id: 'shenxing-basic', name: '神行·基础包',
    monthlyPrice: 40, monthlyDataGB: 260,
  },
  {
    ...sources.shenxing, id: 'shenxing-premium', name: '神行·尊享包',
    monthlyPrice: 72, monthlyDataGB: 520,
  },
  {
    ...sources.shandianshu, id: 'shandianshu-value', name: '闪电鼠·性价版',
    monthlyPrice: 19.9, monthlyDataGB: 100,
  },
  {
    ...sources.shandianshu, id: 'shandianshu-light', name: '闪电鼠·轻快版',
    monthlyPrice: 25, monthlyDataGB: 150,
  },
  {
    ...sources.shandianshu, id: 'shandianshu-fast', name: '闪电鼠·疾速版',
    monthlyPrice: 40, monthlyDataGB: 250,
  },
  {
    ...sources.shandianshu, id: 'shandianshu-thunder', name: '闪电鼠·雷霆版',
    monthlyPrice: 70, monthlyDataGB: 500,
  },
  {
    ...sources.dalaoyun, id: 'dalaoyun-welfare', name: '初云·福利版',
    monthlyPrice: 19.99, monthlyDataGB: 100,
  },
  {
    ...sources.dalaoyun, id: 'dalaoyun-upgrade', name: '初云·提升版',
    monthlyPrice: 25, monthlyDataGB: 150,
  },
  {
    ...sources.dalaoyun, id: 'dalaoyun-basic', name: '凌云·基础版',
    monthlyPrice: 43, monthlyDataGB: 300,
  },
  {
    ...sources.dalaoyun, id: 'dalaoyun-advanced', name: '御云·高级版',
    monthlyPrice: 73, monthlyDataGB: 600,
  },
  {
    ...sources.jiuyun, id: 'jiuyun-zhaocai', name: '招财版',
    monthlyPrice: 6, monthlyDataGB: 150,
  },
  {
    ...sources.jiuyun, id: 'jiuyun-jucai', name: '聚财版',
    monthlyPrice: 9, monthlyDataGB: 300,
  },
  {
    ...sources.jiuyun, id: 'jiuyun-wangcai', name: '旺财版',
    monthlyPrice: 16, monthlyDataGB: 600,
  },
  {
    ...sources.baoyun, id: 'baoyun-caibao', name: '财宝',
    monthlyPrice: 8, monthlyDataGB: 500,
  },
  {
    ...sources.baoyun, id: 'baoyun-jinbao', name: '金宝',
    monthlyPrice: 13, monthlyDataGB: 1000,
  },
  {
    ...sources.civetnet, id: 'civetnet-small', name: '月付 Small',
    monthlyPrice: 25, monthlyDataGB: 150,
  },
  {
    ...sources.civetnet, id: 'civetnet-big', name: '月付 Big',
    monthlyPrice: 45, monthlyDataGB: 300,
  },
  {
    ...sources.liulianyun, id: 'liulianyun-light', name: '轻享包',
    monthlyPrice: 24, monthlyDataGB: 140,
  },
  {
    ...sources.liulianyun, id: 'liulianyun-standard', name: '畅享包',
    monthlyPrice: 40, monthlyDataGB: 260,
  },
  {
    ...sources.liulianyun, id: 'liulianyun-premium', name: '尊享包',
    monthlyPrice: 60, monthlyDataGB: 420,
  },
  {
    ...sources.liulianyun, id: 'liulianyun-moving', name: '搬迁王',
    monthlyPrice: 100, monthlyDataGB: 750,
  },
  {
    ...sources.huanqiuti, id: 'huanqiuti-light', name: '环球轻享',
    monthlyPrice: 22, monthlyDataGB: 120, deviceLimit: '原文标注3台',
  },
  {
    ...sources.huanqiuti, id: 'huanqiuti-standard', name: '环球畅游',
    monthlyPrice: 39, monthlyDataGB: 240, deviceLimit: '原文标注5台',
  },
  {
    ...sources.huanqiuti, id: 'huanqiuti-premium', name: '环球尊享',
    monthlyPrice: 69, monthlyDataGB: 600, deviceLimit: '原文标注10台',
  },
  {
    ...sources.xinghua, id: 'xinghua-light', name: '轻量版',
    monthlyPrice: 3, monthlyDataGB: 200, deviceLimit: '原文标注2台',
  },
  {
    ...sources.xinghua, id: 'xinghua-standard', name: '标准版',
    monthlyPrice: 6, monthlyDataGB: 500, deviceLimit: '原文标注3台',
  },
  {
    ...sources.xinghua, id: 'xinghua-professional', name: '专业版',
    monthlyPrice: 10, monthlyDataGB: 1000, deviceLimit: '原文标注5台',
  },
  {
    ...sources.andy, id: 'andy-monthly-100', name: '月付-100G',
    monthlyPrice: 5, monthlyDataGB: 100, deviceLimit: '原文标注2台',
  },
  {
    ...sources.andy, id: 'andy-monthly-300', name: '月付-300G',
    monthlyPrice: 10, monthlyDataGB: 300, deviceLimit: '原文标注3台',
  },
  {
    ...sources.andy, id: 'andy-monthly-500', name: '月付-500G',
    monthlyPrice: 15, monthlyDataGB: 500, deviceLimit: '原文标注5台',
  },
  {
    ...sources.andy, id: 'andy-monthly-1000', name: '月付-1000G',
    monthlyPrice: 25, monthlyDataGB: 1000, deviceLimit: '原文标注8台',
  },
  {
    ...sources.yuntu, id: 'yuntu-lantu', name: '岚图',
    monthlyPrice: 25, monthlyDataGB: 150,
  },
  {
    ...sources.yuntu, id: 'yuntu-mengtu', name: '梦图',
    monthlyPrice: 49, monthlyDataGB: 300,
  },
  {
    ...sources.yuntu, id: 'yuntu-xingtu', name: '星图',
    monthlyPrice: 99, monthlyDataGB: 600,
  },
]

// 保留部分已知字段；缺失的月度额度待核对，仍可加入资料对比。
export const partialAirportPlans: AirportPlan[] = [
  {
    id: 'wangjikuaiche-monthly-review',
    airportId: 'wangjikuaiche',
    airportName: '网际快车',
    name: '包月套餐（额度待核对）',
    monthlyPrice: 24,
    monthlyDataGB: null,
    dataDescription: '1500GB/月（汇总）／1800GB/月（详情）；每日60GB',
    sourcePath: '/article/wangjikuaiche/',
    sourceDate: '2026-03-22',
    sourceDateKind: 'published',
    deviceLimit: '原文标注不限设备',
    note: '主文标1500GB/月，详情标1800GB/月且每日60GB；月度额度未核实，仅供核对资料。',
  },
]

// 资料存在冲突的机场仍在全量目录中；不把冲突字段伪装成已核实数字。
export const catalogDataNotes: { airportName: string, sourcePath: string, reason: string }[] = [
  {
    airportName: '云界线机场',
    sourcePath: '/vpn/yunjiexian-review-2026/',
    reason: '详情同时出现22/25元、40/45元、66/75元等月付标价，尚不能消除冲突。',
  },
  {
    airportName: '微风网络',
    sourcePath: '/vpn/breezenet-review-2026/',
    reason: '月付价格与标注流量可见，但原文明确提示流量重置规则待确认，不能视为GB/月。',
  },
  {
    airportName: 'Edge-X机场',
    sourcePath: '/article/edge-x-review-2026/',
    reason: '主文入门档写不限流量，详情写200GB/月，额度口径冲突，月度流量标为待核对。',
  },
]

const detailedPlansBySource = new Map<string, AirportPlan[]>()
for (const plan of [...airportPlans, ...partialAirportPlans]) {
  const plans = detailedPlansBySource.get(plan.sourcePath) || []
  plans.push(plan)
  detailedPlansBySource.set(plan.sourcePath, plans)
}

// Every included review is represented. Explicit removals survive automatic regeneration.
// Verified monthly tiers replace a generic overview card.
// Home and article instances import this same complete directory.
export const allAirportPlans: AirportPlan[] = airportDirectory.filter(overview => !excludedSources.has(overview.sourcePath)).flatMap(overview => {
  const detailed = detailedPlansBySource.get(overview.sourcePath)
  const dataNote = catalogDataNotes.find(item => item.sourcePath === overview.sourcePath)?.reason
  return (detailed?.length ? detailed : [overview]).map(plan => ({
    ...overview,
    ...plan,
    priceDescription: overview.priceDescription || plan.priceDescription,
    riskLabel: overview.riskLabel,
    riskPath: overview.riskPath,
    riskTone: overview.riskTone,
    note: [plan.note, dataNote].filter(Boolean).join(' '),
  }))
})
