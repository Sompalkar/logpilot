import { type Request, type Response } from "express";
import { MetricsService } from '../services/metricsService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

/**
 * Get time-series metrics
 * GET /api/v1/metrics/timeseries
 */
export const getTimeSeries = asyncHandler(async (req: Request, res: Response) => {
  const {
    startTime,
    endTime,
    interval = '60',
    service,
    orgId
  } = req.query;

  if (!startTime || !endTime) {
    throw new AppError('startTime and endTime are required', 400);
  }

  const start = new Date(startTime as string);
  const end = new Date(endTime as string);
  const intervalSeconds = parseInt(interval as string);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError('Invalid date format', 400);
  }

  if (intervalSeconds < 1 || intervalSeconds > 3600) {
    throw new AppError('Interval must be between 1 and 3600 seconds', 400);
  }

  const metrics = await MetricsService.getTimeSeries(
    start,
    end,
    intervalSeconds,
    service as string,
    orgId as string
  );

  res.json({
    metrics,
    params: {
      startTime: start,
      endTime: end,
      interval: intervalSeconds,
      service,
      orgId
    }
  });
});

/**
 * Get dashboard metrics
 * GET /api/v1/metrics/dashboard
 */
export const getDashboardMetrics = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, hours = '24' } = req.query;
  const hoursNum = parseInt(hours as string);

  if (hoursNum < 1 || hoursNum > 168) { // Max 1 week
    throw new AppError('Hours must be between 1 and 168', 400);
  }

  const metrics = await MetricsService.getDashboardMetrics(
    orgId as string,
    hoursNum
  );

  res.json(metrics);
});

/**
 * Get service-specific metrics
 * GET /api/v1/metrics/service/:service
 */
export const getServiceMetrics = asyncHandler(async (req: Request, res: Response) => {
  const { service } = req.params;
  const { orgId, hours = '24' } = req.query;

  if (!service) {
    throw new AppError('Service parameter is required', 400);
  }

  const hoursNum = parseInt(hours as string);
  if (hoursNum < 1 || hoursNum > 168) {
    throw new AppError('Hours must be between 1 and 168', 400);
  }

  const metrics = await MetricsService.getServiceMetrics(
    service,
    orgId as string,
    hoursNum
  );

  res.json(metrics);
});

/**
 * Get real-time metrics
 * GET /api/v1/metrics/realtime
 */
export const getRealTimeMetrics = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = req.query;

  const metrics = await MetricsService.getRealTimeMetrics(orgId as string);

  res.json(metrics);
});
