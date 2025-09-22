import prisma from '../config/database.js';
import { config } from '../config/env.js';
import { AnomalyRecord } from '../types/log.types.js';

export class AnomalyService {
  
  /**
   * Run anomaly detection for a specific service
   * Compares recent error rates to baseline rates
   */
  static async detectAnomalies(service: string, orgId?: string): Promise<boolean> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.ANOMALY_WINDOW_SECONDS * 1000);
      const baselineStart = new Date(now.getTime() - config.ANOMALY_BASELINE_SECONDS * 1000);
      const baselineEnd = windowStart;

      // Get recent window stats
      const recentStats = await prisma.log.aggregate({
        where: {
          service,
          orgId: orgId || undefined,
          timestamp: {
            gte: windowStart,
            lte: now
          }
        },
        _count: {
          _all: true,
          level: true
        },
        _avg: {
          latencyMs: true
        }
      });

      const recentErrorCount = await prisma.log.count({
        where: {
          service,
          orgId: orgId || undefined,
          level: 'ERROR',
          timestamp: {
            gte: windowStart,
            lte: now
          }
        }
      });

      // Get baseline stats
      const baselineStats = await prisma.log.aggregate({
        where: {
          service,
          orgId: orgId || undefined,
          timestamp: {
            gte: baselineStart,
            lt: baselineEnd
          }
        },
        _count: {
          _all: true
        }
      });

      const baselineErrorCount = await prisma.log.count({
        where: {
          service,
          orgId: orgId || undefined,
          level: 'ERROR',
          timestamp: {
            gte: baselineStart,
            lt: baselineEnd
          }
        }
      });

      const recentTotal = recentStats._count._all || 0;
      const baselineTotal = baselineStats._count._all || 0;

      // Calculate error rates
      const recentErrorRate = recentTotal > 0 ? recentErrorCount / recentTotal : 0;
      const baselineErrorRate = baselineTotal > 0 ? baselineErrorCount / baselineTotal : 0;

      // Determine if anomaly exists
      let isAnomaly = false;
      let anomalyReason = '';

      if (recentErrorCount >= config.ANOMALY_MIN_ERRORS) {
        if (baselineErrorRate === 0 && recentErrorRate > 0) {
          isAnomaly = true;
          anomalyReason = 'First errors detected';
        } else if (baselineErrorRate > 0 && recentErrorRate >= baselineErrorRate * config.ANOMALY_FACTOR) {
          isAnomaly = true;
          anomalyReason = `Error rate ${(recentErrorRate * 100).toFixed(2)}% is ${(recentErrorRate / baselineErrorRate).toFixed(1)}x baseline`;
        }
      }

      // Store anomaly if detected
      if (isAnomaly) {
        await prisma.anomaly.create({
          data: {
            orgId,
            service,
            windowStart,
            windowEnd: now,
            errorCount: recentErrorCount,
            totalCount: recentTotal,
            errorRate: recentErrorRate,
            baseline: baselineErrorRate,
            score: recentErrorRate / (baselineErrorRate || 0.001),
            evidence: {
              reason: anomalyReason,
              recentWindow: `${config.ANOMALY_WINDOW_SECONDS}s`,
              baselineWindow: `${config.ANOMALY_BASELINE_SECONDS}s`,
              factor: config.ANOMALY_FACTOR,
              avgLatency: recentStats._avg.latencyMs
            }
          }
        });

        console.log(`[ANOMALY DETECTED] ${service} (orgId: ${orgId}): ${anomalyReason}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in anomaly detection:', error);
      return false;
    }
  }

  /**
   * Get recent anomalies with pagination
   */
  static async getAnomalies(
    orgId?: string,
    service?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AnomalyRecord[]> {
    const where: any = {};
    if (orgId) where.orgId = orgId;
    if (service) where.service = service;

    const anomalies = await prisma.anomaly.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return anomalies.map(anomaly => ({
      id: anomaly.id,
      orgId: anomaly.orgId || undefined,
      service: anomaly.service || undefined,
      windowStart: anomaly.windowStart,
      windowEnd: anomaly.windowEnd,
      errorCount: anomaly.errorCount || undefined,
      totalCount: anomaly.totalCount || undefined,
      errorRate: anomaly.errorRate || undefined,
      baseline: anomaly.baseline || undefined,
      score: anomaly.score || undefined,
      evidence: anomaly.evidence as Record<string, any> || undefined,
      createdAt: anomaly.createdAt
    }));
  }

  /**
   * Get anomaly statistics
   */
  static async getAnomalyStats(orgId?: string, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const where: any = {
      createdAt: { gte: since }
    };
    if (orgId) where.orgId = orgId;

    const stats = await prisma.anomaly.aggregate({
      where,
      _count: { _all: true },
      _avg: { 
        errorRate: true,
        score: true 
      }
    });

    const byService = await (prisma.anomaly.groupBy as any)({
      by: ['service'],
      where,
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } }
    });

    return {
      totalAnomalies: stats._count._all,
      avgErrorRate: stats._avg.errorRate,
      avgScore: stats._avg.score,
      topServices: byService.map(item => ({
        service: item.service,
        count: item._count._all
      }))
    };
  }
}
