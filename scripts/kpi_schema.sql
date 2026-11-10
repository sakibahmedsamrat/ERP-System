-- Step 1: Update Worker table
ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "supervisorId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Worker_supervisorId_fkey'
  ) THEN
    ALTER TABLE "Worker" 
    ADD CONSTRAINT "Worker_supervisorId_fkey" 
    FOREIGN KEY ("supervisorId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Worker_supervisorId_idx" ON "Worker"("supervisorId");

-- Step 2: Create KpiAccount table
CREATE TABLE IF NOT EXISTS "KpiAccount" (
  "id" TEXT NOT NULL,
  "workerId" TEXT NOT NULL,
  "loginId" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "isSupervisor" BOOLEAN NOT NULL DEFAULT false,
  "lastLogin" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KpiAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "KpiAccount_workerId_key" ON "KpiAccount"("workerId");
CREATE UNIQUE INDEX IF NOT EXISTS "KpiAccount_loginId_key" ON "KpiAccount"("loginId");
CREATE INDEX IF NOT EXISTS "KpiAccount_loginId_idx" ON "KpiAccount"("loginId");
CREATE INDEX IF NOT EXISTS "KpiAccount_isSupervisor_idx" ON "KpiAccount"("isSupervisor");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'KpiAccount_workerId_fkey'
  ) THEN
    ALTER TABLE "KpiAccount" 
    ADD CONSTRAINT "KpiAccount_workerId_fkey" 
    FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Step 3: Create KpiTarget table
CREATE TABLE IF NOT EXISTS "KpiTarget" (
  "id" TEXT NOT NULL,
  "workerId" TEXT NOT NULL,
  "supervisorId" TEXT,
  "period" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'OPERATIONAL',
  "targetValue" DOUBLE PRECISION,
  "unit" TEXT,
  "weightage" DOUBLE PRECISION NOT NULL DEFAULT 20,
  "deadline" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "actualValue" DOUBLE PRECISION,
  "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "employeeNotes" TEXT,
  "submittedAt" TIMESTAMP(3),
  "supervisorScore" DOUBLE PRECISION,
  "supervisorRating" TEXT,
  "supervisorFeedback" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KpiTarget_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "KpiTarget_workerId_idx" ON "KpiTarget"("workerId");
CREATE INDEX IF NOT EXISTS "KpiTarget_supervisorId_idx" ON "KpiTarget"("supervisorId");
CREATE INDEX IF NOT EXISTS "KpiTarget_period_idx" ON "KpiTarget"("period");
CREATE INDEX IF NOT EXISTS "KpiTarget_status_idx" ON "KpiTarget"("status");
CREATE INDEX IF NOT EXISTS "KpiTarget_workerId_period_idx" ON "KpiTarget"("workerId", "period");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'KpiTarget_workerId_fkey'
  ) THEN
    ALTER TABLE "KpiTarget" 
    ADD CONSTRAINT "KpiTarget_workerId_fkey" 
    FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'KpiTarget_supervisorId_fkey'
  ) THEN
    ALTER TABLE "KpiTarget" 
    ADD CONSTRAINT "KpiTarget_supervisorId_fkey" 
    FOREIGN KEY ("supervisorId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
