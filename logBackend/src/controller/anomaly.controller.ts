import { type Request, type Response } from "express";
import { AnomalyService } from '../services/anomalyService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

/**
 * Get anomalies with filtering and pagination
 * GET /api/v1/anomalies
 */
export const getAnomalies = asyncHandler(async (req: Request, res: Response) => {
  const {
    orgId,
    service,
    limit = '50',
    offset = '0'
  } = req.query;

  const limitNum = parseInt(limit as string);
  const offsetNum = parseInt(offset as string);

  if (limitNum < 1 || limitNum > 1000) {
    throw new AppError('Limit must be between 1 and 1000', 400);
  }

  if (offsetNum < 0) {
    throw new AppError('Offset must be non-negative', 400);
  }

  const anomalies = await AnomalyService.getAnomalies(
    orgId as string,
    service as string,
    limitNum,
    offsetNum
  );

  res.json({
    anomalies,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      hasMore: anomalies.length === limitNum
    }
  });
});

/**
 * Get anomaly statistics
 * GET /api/v1/anomalies/stats
 */
export const getAnomalyStats = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, hours = '24' } = req.query;
  const hoursNum = parseInt(hours as string);

  if (hoursNum < 1 || hoursNum > 168) { // Max 1 week
    throw new AppError('Hours must be between 1 and 168', 400);
  }

  const stats = await AnomalyService.getAnomalyStats(
    orgId as string,
    hoursNum
  );

  res.json(stats);
});

/**
 * Trigger manual anomaly detection for a service
 * POST /api/v1/anomalies/detect
 */
export const triggerAnomalyDetection = asyncHandler(async (req: Request, res: Response) => {
  const { service, orgId } = req.body;

  if (!service) {
    throw new AppError('Service is required', 400);
  }

  const detected = await AnomalyService.detectAnomalies(service, orgId);

  res.json({
    service,
    orgId,
    anomalyDetected: detected,
    message: detected 
      ? 'Anomaly detected and recorded' 
      : 'No anomaly detected for the current time window'
  });
});
