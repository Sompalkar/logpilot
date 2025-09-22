import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '8000'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/logpilot',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Anomaly Detection
  ANOMALY_WINDOW_SECONDS: parseInt(process.env.ANOMALY_WINDOW_SECONDS || '120'),
  ANOMALY_BASELINE_SECONDS: parseInt(process.env.ANOMALY_BASELINE_SECONDS || '3600'),
  ANOMALY_FACTOR: parseFloat(process.env.ANOMALY_FACTOR || '3.0'),
  ANOMALY_MIN_ERRORS: parseInt(process.env.ANOMALY_MIN_ERRORS || '3'),

  // S3/Storage
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'logpilot-raw-logs',

  // API
  API_RATE_LIMIT: parseInt(process.env.API_RATE_LIMIT || '1000'),
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '500'),
  BATCH_TIMEOUT_MS: parseInt(process.env.BATCH_TIMEOUT_MS || '1000'),

  // Development helpers
  get isDevelopment() {
    return this.NODE_ENV === 'development';
  },

  get isProduction() {
    return this.NODE_ENV === 'production';
  }
};
