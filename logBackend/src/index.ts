

import express from 'express';
import cors from 'cors';
import { type Request, type Response } from 'express';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes.js';
import ingestRoutes from './routes/ingest.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import anomalyRoutes from './routes/anomaly.routes.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { config } from './config/env.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', ingestRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/anomalies', anomalyRoutes);

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "LogPilot Backend API",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/v1/auth",
      ingest: "/api/v1/ingest", 
      logs: "/api/v1/logs",
      metrics: "/api/v1/metrics",
      anomalies: "/api/v1/anomalies"
    }
  });
});

// API info endpoint
app.get("/api/v1", (req: Request, res: Response) => {
  res.status(200).json({
    name: "LogPilot API",
    version: "1.0.0",
    description: "Log ingestion, metrics, and anomaly detection API",
    endpoints: [
      "POST /api/v1/auth/register - Register user",
      "POST /api/v1/auth/login - Login user", 
      "GET /api/v1/auth/profile - Get user profile",
      "POST /api/v1/ingest - Ingest logs",
      "GET /api/v1/logs - Get logs with filtering",
      "GET /api/v1/logs/stats - Get log statistics",
      "GET /api/v1/metrics/timeseries - Get time-series metrics",
      "GET /api/v1/metrics/dashboard - Get dashboard metrics",
      "GET /api/v1/metrics/service/:service - Get service metrics",
      "GET /api/v1/metrics/realtime - Get real-time metrics",
      "GET /api/v1/anomalies - Get anomalies",
      "GET /api/v1/anomalies/stats - Get anomaly statistics",
      "POST /api/v1/anomalies/detect - Trigger anomaly detection"
    ]
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 LogPilot Backend API running on port ${config.PORT}`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 API Base URL: http://localhost:${config.PORT}/api/v1`);
  console.log(`📋 Health Check: http://localhost:${config.PORT}/`);
});