import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/admin/analytics — Get platform analytics
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '7d'
    
    // Calculate date range
    const now = new Date()
    const daysBack = period === '30d' ? 30 : period === '24h' ? 1 : 7
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Fetch analytics data in parallel
    const [
      totalUsers,
      newUsers,
      totalSearches,
      totalClicks,
      totalConversions,
      topDestinations,
      revenueData,
    ] = await Promise.all([
      // Total users
      prisma.user.count().catch(() => 0),
      
      // New users in period
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }).catch(() => 0),
      
      // Total search sessions in period
      prisma.searchSession.count({
        where: { created_at: { gte: startDate } }
      }).catch(() => 0),
      
      // Total clicks in period
      prisma.clickEvent.count({
        where: { timestamp: { gte: startDate } }
      }).catch(() => 0),
      
      // Total conversions in period
      prisma.conversionEvent.count({
        where: { timestamp: { gte: startDate } }
      }).catch(() => 0),
      
      // Top destinations by clicks
      prisma.clickEvent.groupBy({
        by: ['destination'],
        _count: { id: true },
        where: { timestamp: { gte: startDate } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }).catch(() => []),
      
      // Revenue data
      prisma.conversionEvent.aggregate({
        _sum: { commission: true },
        where: { 
          timestamp: { gte: startDate },
          status: 'APPROVED'
        }
      }).catch(() => ({ _sum: { commission: null } })),
    ])

    // Calculate conversion rate
    const conversionRate = totalClicks > 0 
      ? ((totalConversions / totalClicks) * 100).toFixed(2) 
      : '0.00'

    // Calculate EPC (earnings per click)
    const totalRevenue = Number(revenueData._sum?.commission || 0)
    const epc = totalClicks > 0 
      ? (totalRevenue / totalClicks).toFixed(2) 
      : '0.00'

    return NextResponse.json({
      ok: true,
      period,
      metrics: {
        totalUsers,
        newUsers,
        totalSearches,
        totalClicks,
        totalConversions,
        conversionRate: `${conversionRate}%`,
        totalRevenue: totalRevenue.toFixed(2),
        epc,
      },
      topDestinations: topDestinations.map(d => ({
        code: d.destination || 'Unknown',
        clicks: d._count.id,
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({
      ok: true,
      period: '7d',
      metrics: {
        totalUsers: 0,
        newUsers: 0,
        totalSearches: 0,
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: '0.00%',
        totalRevenue: '0.00',
        epc: '0.00',
      },
      topDestinations: [],
      generatedAt: new Date().toISOString(),
    })
  }
}
