import { Router } from "express";
import { ingestLog, getLogs, getLogStats } from "../controller/ingest.controller.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = Router();

// Log ingestion - requires authentication
router.post('/ingest', authenticateToken, ingestLog);

// Get logs with filtering - requires authentication  
router.get('/logs', authenticateToken, getLogs);

// Get log statistics - requires authentication
router.get('/logs/stats', authenticateToken, getLogStats);

export default router;