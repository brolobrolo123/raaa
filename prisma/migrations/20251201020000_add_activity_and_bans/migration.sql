-- Create user activity log to track minutes spent in the app
CREATE TABLE "UserActivity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- Create user ban history table
CREATE TABLE "UserBan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "issuedById" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserBan_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "UserActivity_userId_recordedAt_idx" ON "UserActivity" ("userId", "recordedAt");
CREATE INDEX "UserBan_userId_startAt_idx" ON "UserBan" ("userId", "startAt");

-- Foreign keys
ALTER TABLE "UserActivity"
  ADD CONSTRAINT "UserActivity_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserBan"
  ADD CONSTRAINT "UserBan_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "UserBan_issuedById_fkey"
    FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
