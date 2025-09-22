import { Router } from "express";
import { 
  getAnomalies, 
  getAnomalyStats, 
  triggerAnomalyDetection 
} from "../controller/anomaly.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// All anomaly routes require authentication
router.use(authenticateToken);

// Get anomalies with filtering
router.get('/', getAnomalies);

// Get anomaly statistics
router.get('/stats', getAnomalyStats);

// Trigger manual anomaly detection
router.post('/detect', triggerAnomalyDetection);

export default router;
