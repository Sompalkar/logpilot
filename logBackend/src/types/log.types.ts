export interface LogInput {
  orgId?: string;
  service: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  timestamp: string;
  message?: string;
  latencyMs?: number;
  responseCode?: number;
  metadata?: Record<string, any>;
}

export interface LogRecord extends LogInput {
  id: string;
  rawS3Path?: string;
  createdAt: Date;
}

export interface AnomalyRecord {
  id: string;
  orgId?: string;
  service?: string;
  windowStart: Date;
  windowEnd: Date;
  errorCount?: number;
  totalCount?: number;
  errorRate?: number;
  baseline?: number;
  score?: number;
  evidence?: Record<string, any>;
  createdAt: Date;
}

export interface MetricsResult {
  timestamp: Date;
  totalCount: number;
  errorCount: number;
  avgLatency?: number;
  service?: string;
}

export interface BatchIngestResult {
  accepted: number;
  rejected: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}
