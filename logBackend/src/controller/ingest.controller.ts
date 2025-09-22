import { type Request, type Response } from "express";
import prisma from '../config/database.js';
import { validateLog, validateBatchLogs, formatValidationErrors } from '../utils/validation.js';
import { LogInput, BatchIngestResult } from '../types/log.types.js';
import { AnomalyService } from '../services/anomalyService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

/**
 * Ingest single or batch logs
 * POST /api/v1/ingest
 */
export const ingestLog = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;
  
  // Handle both single log and batch
  const isArray = Array.isArray(body);
  const logs: LogInput[] = isArray ? body : [body];
  
  // Validate input
  if (!isArray && !validateLog(body)) {
    throw new AppError(
      `Validation failed: ${formatValidationErrors(validateLog.errors || [])}`,
      400
    );
  }
  
  if (isArray && !validateBatchLogs(body)) {
    throw new AppError(
      `Batch validation failed: ${formatValidationErrors(validateBatchLogs.errors || [])}`,
      400
    );
  }

  const result: BatchIngestResult = {
    accepted: 0,
    rejected: 0,
    errors: []
  };

  // Process logs in transaction
  try {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        
        try {
          // Create log record
          await tx.log.create({
            data: {
              orgId: log.orgId || null,
              service: log.service,
              level: log.level,
              timestamp: new Date(log.timestamp),
              message: log.message || null,
              latencyMs: log.latencyMs || null,
              responseCode: log.responseCode || null,
              metadata: log.metadata || null,
              rawS3Path: null // TODO: Implement S3 storage later
            } as any
          });
          
          result.accepted++;
        } catch (error: any) {
          result.rejected++;
          result.errors?.push({
            index: i,
            error: error.message
          });
        }
      }
    });

    // Run anomaly detection for affected services
    const uniqueServices = [...new Set(logs.map(log => log.service))];
    for (const service of uniqueServices) {
      // Run anomaly detection in background (don't await)
      setImmediate(() => {
        AnomalyService.detectAnomalies(service, logs.find(l => l.service === service)?.orgId);
      });
    }

    // Log successful ingestion
    console.log(`[INGEST] Processed ${logs.length} logs: ${result.accepted} accepted, ${result.rejected} rejected`);

    res.status(200).json(result);
    
  } catch (error: any) {
    console.error('Ingest transaction failed:', error);
    throw new AppError('Failed to ingest logs', 500);
  }
});

/**
 * Get logs with filtering and pagination
 * GET /api/v1/logs
 */
export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const {
    service,
    level,
    orgId,
    startTime,
    endTime,
    limit = '50',
    offset = '0',
    search
  } = req.query;

  const where: any = {};
  
  if (service) where.service = service;
  if (level) where.level = level;
  if (orgId) where.orgId = orgId;
  if (search) {
    where.message = {
      contains: search as string,
      mode: 'insensitive'
    };
  }
  
  if (startTime || endTime) {
    where.timestamp = {};
    if (startTime) where.timestamp.gte = new Date(startTime as string);
    if (endTime) where.timestamp.lte = new Date(endTime as string);
  }

  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        orgId: true,
        service: true,
        level: true,
        timestamp: true,
        message: true,
        latencyMs: true,
        responseCode: true,
        metadata: true,
        createdAt: true
      }
    }),
    prisma.log.count({ where })
  ]);

  res.json({
    logs,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: total > parseInt(offset as string) + parseInt(limit as string)
    }
  });
});

/**
 * Get log statistics
 * GET /api/v1/logs/stats
 */
export const getLogStats = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, hours = '24' } = req.query;
  const since = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);
  
  const where: any = {
    timestamp: { gte: since }
  };
  if (orgId) where.orgId = orgId;

  const [totalStats, levelStats, serviceStats] = await Promise.all([
    prisma.log.aggregate({
      where,
      _count: { _all: true },
      _avg: { latencyMs: true }
    }),
    prisma.log.groupBy({
      by: ['level'],
      where,
      _count: { _all: true }
    }),
    (prisma.log.groupBy as any)({
      by: ['service'],
      where,
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 10
    })
  ]);

  res.json({
    total: totalStats._count._all,
    avgLatency: totalStats._avg.latencyMs,
    byLevel: levelStats.map(stat => ({
      level: stat.level,
      count: stat._count._all
    })),
    topServices: serviceStats.map(stat => ({
      service: stat.service,
      count: stat._count._all
    }))
  });
});