import prisma from '../config/database.js';
import { MetricsResult } from '../types/log.types.js';

export class MetricsService {
  
  /**
   * Get time-series metrics with specified interval
   */
  static async getTimeSeries(
    startDate: Date | string,
    endDate: Date | string,
    intervalSeconds: number = 60,
    service?: string,
    orgId?: string
  ): Promise<MetricsResult[]> {
    
    // Convert to Date objects if needed
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    const where: any = {
      timestamp: {
        gte: start,
        lte: end
      }
    };

    if (service) where.service = service;
    if (orgId) where.orgId = orgId;

    // Use raw query for time bucketing
    const query = `
      SELECT 
        date_trunc('minute', timestamp) + 
        INTERVAL '${intervalSeconds} seconds' * 
        FLOOR(EXTRACT(EPOCH FROM (timestamp - date_trunc('minute', timestamp))) / ${intervalSeconds}) 
        as bucket,
        service,
        COUNT(*)::int as total_count,
        COUNT(CASE WHEN level = 'ERROR' THEN 1 END)::int as error_count,
        AVG(CASE WHEN "latencyMs" IS NOT NULL THEN "latencyMs" END) as avg_latency
      FROM "Log"
      WHERE timestamp >= $1 AND timestamp <= $2
      ${service ? 'AND service = $3' : ''}
      ${orgId ? `AND "orgId" = $${service ? '4' : '3'}` : ''}
      GROUP BY bucket, service
      ORDER BY bucket ASC;
    `;

    const params: any[] = [start, end];
    if (service) params.push(service);
    if (orgId) params.push(orgId);

    const results = await prisma.$queryRawUnsafe(query, ...params) as any[];

    return results.map(row => ({
      timestamp: new Date(row.bucket),
      totalCount: row.total_count,
      errorCount: row.error_count,
      avgLatency: row.avg_latency ? parseFloat(row.avg_latency) : undefined,
      service: row.service
    }));
  }

  /**
   * Get aggregated metrics for dashboard
   */
  static async getDashboardMetrics(
    orgId?: string,
    hours: number = 24
  ): Promise<{
    totalLogs: number;
    totalErrors: number;
    errorRate: number;
    avgLatency: number;
    topServices: Array<{ service: string; count: number; errorRate: number }>;
    recentTrend: MetricsResult[];
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const where: any = {
      timestamp: { gte: since }
    };
    if (orgId) where.orgId = orgId;

    // Overall stats
    const totalStats = await prisma.log.aggregate({
      where,
      _count: { _all: true },
      _avg: { latencyMs: true }
    });

    const errorCount = await prisma.log.count({
      where: { ...where, level: 'ERROR' }
    });

    const totalLogs = totalStats._count._all || 0;
    const errorRate = totalLogs > 0 ? errorCount / totalLogs : 0;

    // Top services
    const serviceStats = await (prisma.log.groupBy as any)({
      by: ['service'],
      where,
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 10
    });

    const topServices = await Promise.all(
      serviceStats.map(async (stat) => {
        const serviceErrors = await prisma.log.count({
          where: { ...where, service: stat.service, level: 'ERROR' }
        });
        return {
          service: stat.service,
          count: stat._count._all,
          errorRate: stat._count._all > 0 ? serviceErrors / stat._count._all : 0
        };
      })
    );

    // Recent trend (last 6 hours in 30-minute buckets)
    const trendStart = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentTrend = await this.getTimeSeries(
      trendStart,
      new Date(),
      30 * 60, // 30 minutes
      undefined,
      orgId
    );

    return {
      totalLogs,
      totalErrors: errorCount,
      errorRate,
      avgLatency: totalStats._avg.latencyMs || 0,
      topServices,
      recentTrend
    };
  }

  /**
   * Get service-specific metrics
   */
  static async getServiceMetrics(
    service: string,
    orgId?: string,
    hours: number = 24
  ) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const where: any = {
      service,
      timestamp: { gte: since }
    };
    if (orgId) where.orgId = orgId;

    const stats = await prisma.log.aggregate({
      where,
      _count: { _all: true },
      _avg: { latencyMs: true },
      _min: { latencyMs: true },
      _max: { latencyMs: true }
    });

    const errorCount = await prisma.log.count({
      where: { ...where, level: 'ERROR' }
    });

    const responseCodes = await (prisma.log.groupBy as any)({
      by: ['responseCode'],
      where: { ...where, responseCode: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } }
    });

    const timeline = await this.getTimeSeries(
      since as any,
      new Date() as any,
      5 * 60, // 5 minutes
      service,
      orgId
    );

    return {
      service,
      totalLogs: stats._count._all || 0,
      errorCount,
      errorRate: stats._count._all ? errorCount / stats._count._all : 0,
      avgLatency: stats._avg.latencyMs || 0,
      minLatency: stats._min.latencyMs || 0,
      maxLatency: stats._max.latencyMs || 0,
      responseCodes: responseCodes.map(rc => ({
        code: rc.responseCode,
        count: rc._count._all
      })),
      timeline
    };
  }

  /**
   * Get real-time metrics (last few minutes)
   */
  static async getRealTimeMetrics(orgId?: string) {
    const since = new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes
    
    const where: any = {
      timestamp: { gte: since }
    };
    if (orgId) where.orgId = orgId;

    const recentLogs = await prisma.log.count({ where });
    const recentErrors = await prisma.log.count({ 
      where: { ...where, level: 'ERROR' } 
    });

    const avgLatency = await prisma.log.aggregate({
      where: { ...where, latencyMs: { not: null } },
      _avg: { latencyMs: true }
    });

    // Latest logs for activity feed
    const latestLogs = await prisma.log.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        id: true,
        service: true,
        level: true,
        message: true,
        timestamp: true,
        latencyMs: true,
        responseCode: true
      }
    });

    return {
      logsPerMinute: recentLogs,
      errorsPerMinute: recentErrors,
      avgLatency: avgLatency._avg.latencyMs || 0,
      latestLogs,
      timestamp: new Date()
    };
  }
}
