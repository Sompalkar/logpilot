# LogPilot - Log Ingestion & Anomaly Detection System

A comprehensive log ingestion system with real-time metrics and intelligent anomaly detection built with TypeScript, Express.js, PostgreSQL, and Prisma.

## 🚀 Features

- **High-Performance Log Ingestion**: Batch processing with validation
- **Real-time Metrics**: Time-series data with customizable intervals  
- **Intelligent Anomaly Detection**: Statistical error rate analysis
- **JWT Authentication**: Secure API access
- **RESTful API**: Clean MVC architecture
- **Docker Ready**: Complete containerized setup
- **Production Grade**: Error handling, logging, health checks

## 🏗️ Architecture

```
[Log Generator] → [Ingest API] → [PostgreSQL] → [Metrics & Anomaly Services] → [Dashboard]
                       ↓
                  [Redis Cache] 
```

## 📋 Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis (optional, for caching)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository>
cd LogPilot

# Copy environment configuration
cp logBackend/env.example logBackend/.env
```

### 2. Docker Setup (Recommended)

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 3. Manual Setup

#### Backend Setup
```bash
cd logBackend

# Install dependencies
npm install

# Setup database
npx prisma migrate dev
npx prisma generate

# Start backend
npm run dev
```

#### Log Generator Setup
```bash
cd LogService

# Install dependencies
npm install

# Start log generator
npm run dev
```

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/profile` - Get user profile

### Log Ingestion
- `POST /api/v1/ingest` - Ingest logs (single or batch)
- `GET /api/v1/logs` - Get logs with filtering
- `GET /api/v1/logs/stats` - Get log statistics

### Metrics
- `GET /api/v1/metrics/timeseries` - Time-series metrics
- `GET /api/v1/metrics/dashboard` - Dashboard overview
- `GET /api/v1/metrics/service/:service` - Service-specific metrics
- `GET /api/v1/metrics/realtime` - Real-time metrics

### Anomalies
- `GET /api/v1/anomalies` - Get anomalies
- `GET /api/v1/anomalies/stats` - Anomaly statistics
- `POST /api/v1/anomalies/detect` - Trigger manual detection

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/logpilot"

# Server
PORT=8000
NODE_ENV=development

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRY="24h"

# Anomaly Detection
ANOMALY_WINDOW_SECONDS=120
ANOMALY_BASELINE_SECONDS=3600
ANOMALY_FACTOR=3.0
ANOMALY_MIN_ERRORS=3
```

## 📝 Usage Examples

### 1. Register User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123","role":"admin"}'
```

### 2. Login and Get Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Save the token from response
export TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### 3. Ingest Single Log
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org-1",
    "service": "auth-service",
    "level": "ERROR",
    "timestamp": "2024-01-01T12:00:00Z",
    "message": "User authentication failed",
    "latencyMs": 150,
    "responseCode": 401
  }'
```

### 4. Ingest Batch Logs
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {"service":"payment-service","level":"INFO","timestamp":"2024-01-01T12:00:00Z","message":"Payment processed"},
    {"service":"payment-service","level":"ERROR","timestamp":"2024-01-01T12:01:00Z","message":"Payment failed"}
  ]'
```

### 5. Get Metrics
```bash
# Dashboard metrics
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/metrics/dashboard?hours=24"

# Time-series data
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/metrics/timeseries?startTime=2024-01-01T00:00:00Z&endTime=2024-01-01T23:59:59Z&interval=300"

# Service metrics
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/metrics/service/payment-service"
```

### 6. Get Anomalies
```bash
# List anomalies
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/anomalies?limit=20"

# Anomaly statistics
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/anomalies/stats?hours=24"
```

## 🔍 Log Schema

```typescript
interface LogInput {
  orgId?: string;           // Organization ID
  service: string;          // Service name (required)
  level: 'INFO'|'WARN'|'ERROR'|'DEBUG'; // Log level (required)
  timestamp: string;        // ISO 8601 timestamp (required)
  message?: string;         // Log message
  latencyMs?: number;       // Request latency
  responseCode?: number;    // HTTP response code
  metadata?: object;        // Additional metadata
}
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:8000/
```

### Load Testing
```bash
# Generate high-frequency logs to test anomaly detection
cd LogService
npm run dev
```

### Database Access
```bash
# Using Docker
docker-compose exec postgres psql -U postgres -d logpilot

# Query logs
SELECT COUNT(*) FROM "Log";
SELECT service, COUNT(*) FROM "Log" GROUP BY service;
```

## 🔧 Development

### Database Migrations
```bash
cd logBackend

# Create migration
npx prisma migrate dev --name your_migration_name

# Reset database
npx prisma migrate reset

# Studio (GUI)
npx prisma studio
```

### Adding New Features
1. Update Prisma schema if needed
2. Create/update controllers in `src/controller/`
3. Create/update routes in `src/routes/`
4. Add services in `src/services/`
5. Update main `src/index.ts`

## 📈 Monitoring

### Docker Logs
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f log-generator
```

### Health Checks
```bash
# Service status
docker-compose ps

# Health endpoints
curl http://localhost:8000/                    # Backend health
curl http://localhost:8000/api/v1/metrics/realtime  # Real-time metrics
```

### Database Monitoring
```bash
# Start pgAdmin (optional)
docker-compose --profile tools up pgadmin

# Access: http://localhost:5050
# Email: admin@logpilot.com, Password: admin
```

## 🚀 Production Deployment

### Environment Setup
1. Update `.env` with production values
2. Set strong `JWT_SECRET`
3. Configure production database
4. Set up Redis for scaling
5. Configure monitoring & alerting

### Security Considerations
- Use HTTPS in production
- Implement rate limiting
- Set up CORS properly
- Use environment secrets management
- Regular security updates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes following existing patterns
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details
