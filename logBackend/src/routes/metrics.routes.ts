import { Router } from "express";
import { 
  getTimeSeries, 
  getDashboardMetrics, 
  getServiceMetrics, 
  getRealTimeMetrics 
} from "../controller/metrics.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// All metrics routes require authentication
router.use(authenticateToken);

// Get time-series metrics
router.get('/timeseries', getTimeSeries);

// Get dashboard metrics summary
router.get('/dashboard', getDashboardMetrics);

// Get service-specific metrics
router.get('/service/:service', getServiceMetrics);

// Get real-time metrics (last few minutes)
router.get('/realtime', getRealTimeMetrics);

export default router;
