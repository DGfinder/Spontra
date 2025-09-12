import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest, clickEventApiSchema } from '@/lib/validations'
import { ClickEvent } from '@/services/affiliateService'
import { cacheGet, cacheSet } from '@/lib/cacheServer'

export const runtime = 'nodejs'

const STORE_KEY = 'analytics:clicks'
const MAX_EVENTS = 10000

async function readEvents(): Promise<ClickEvent[]> {
  try {
    const raw = await cacheGet(STORE_KEY)
    return raw ? (JSON.parse(raw) as ClickEvent[]) : []
  } catch {
    return []
  }
}

async function writeEvents(events: ClickEvent[]): Promise<void> {
  const trimmed = events.slice(-MAX_EVENTS)
  await cacheSet(STORE_KEY, JSON.stringify(trimmed), { ttlSeconds: 604800 }).catch(() => {})
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = validateApiRequest(clickEventApiSchema, body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid click event data', details: validation.errors }, { status: 400 })
    }

    const clickEvent = validation.data
    console.log('Click tracking event received:', {
      clickId: clickEvent.id,
      partnerId: clickEvent.partnerId,
      flightId: clickEvent.flightId,
      bookingValue: clickEvent.bookingValue,
      timestamp: clickEvent.timestamp
    })

    const completeClickEvent: ClickEvent = {
      ...clickEvent,
      timestamp: clickEvent.timestamp || new Date().toISOString()
    }

    const current = await readEvents()
    current.push(completeClickEvent)
    await writeEvents(current)

    return NextResponse.json({ success: true, clickId: clickEvent.id, message: 'Click event tracked successfully' })
  } catch (error) {
    console.error('Click tracking error:', error)
    return NextResponse.json({ success: false, error: 'Failed to track click event' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const partnerId = url.searchParams.get('partner')
    const timeframe = url.searchParams.get('timeframe') || '24h'

    const now = new Date()
    const timeWindow = getTimeWindow(timeframe)
    const since = new Date(now.getTime() - timeWindow)

    let filteredEvents = (await readEvents()).filter(e => new Date(e.timestamp) >= since)
    if (partnerId) filteredEvents = filteredEvents.filter(e => e.partnerId === partnerId)

    const metrics = calculateMetrics(filteredEvents)
    return NextResponse.json({ success: true, timeframe, partnerId, metrics, eventCount: filteredEvents.length })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

function getTimeWindow(timeframe: string): number {
  const windows: Record<string, number> = {
    '1h': 3600000,
    '24h': 86400000,
    '7d': 604800000,
    '30d': 2592000000
  }
  return windows[timeframe] || windows['24h']
}

function calculateMetrics(events: ClickEvent[]) {
  const totalClicks = events.length
  const totalValue = events.reduce((sum, e) => sum + e.bookingValue, 0)
  const averageValue = totalClicks > 0 ? totalValue / totalClicks : 0

  const partnerStats = events.reduce((acc, e) => {
    if (!acc[e.partnerId]) acc[e.partnerId] = { clicks: 0, totalValue: 0, averageValue: 0 }
    acc[e.partnerId].clicks += 1
    acc[e.partnerId].totalValue += e.bookingValue
    return acc
  }, {} as Record<string, { clicks: number; totalValue: number; averageValue: number }>)

  Object.keys(partnerStats).forEach(p => {
    partnerStats[p].averageValue = partnerStats[p].totalValue / partnerStats[p].clicks
  })

  const deviceStats = events.reduce((acc, e) => {
    acc[e.deviceType] = (acc[e.deviceType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topPartner = Object.keys(partnerStats).sort((a, b) => partnerStats[b].clicks - partnerStats[a].clicks)[0]

  return {
    totalClicks,
    totalValue: Math.round(totalValue * 100) / 100,
    averageValue: Math.round(averageValue * 100) / 100,
    partnerStats,
    deviceStats,
    topPartner
  }
}

