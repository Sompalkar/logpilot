-- CreateTable
CREATE TABLE "public"."Log" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "latencyMs" INTEGER NOT NULL,
    "responseCode" INTEGER NOT NULL,
    "metadata" JSONB,
    "rasS3Path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LogVector" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vectorId" TEXT NOT NULL,
    "dims" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogVector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Anomaly" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "service" TEXT,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "errorCount" INTEGER,
    "totalCount" INTEGER,
    "errorRate" DOUBLE PRECISION,
    "baseline" DOUBLE PRECISION,
    "score" DOUBLE PRECISION,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Log_service_timestamp_idx" ON "public"."Log"("service", "timestamp");

-- CreateIndex
CREATE INDEX "Log_orgId_timestamp_idx" ON "public"."Log"("orgId", "timestamp");

-- CreateIndex
CREATE INDEX "LogVector_orgId_service_createdAt_idx" ON "public"."LogVector"("orgId", "service", "createdAt");

-- CreateIndex
CREATE INDEX "LogVector_logId_idx" ON "public"."LogVector"("logId");

-- CreateIndex
CREATE INDEX "Anomaly_orgId_service_createdAt_idx" ON "public"."Anomaly"("orgId", "service", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");
