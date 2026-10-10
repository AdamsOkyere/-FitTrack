CREATE TYPE "ActivityType" AS ENUM ('WALK', 'WATER', 'SLEEP');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stepGoal" INTEGER NOT NULL DEFAULT 8000,
    "waterGoalMl" INTEGER NOT NULL DEFAULT 2000,
    "sleepGoalHrs" DOUBLE PRECISION NOT NULL DEFAULT 8,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "secondaryValue" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "ActivityLog_userId_type_date_idx" ON "ActivityLog"("userId", "type", "date");

ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;