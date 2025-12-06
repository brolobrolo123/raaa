-- Create custom role enum for the updated user model
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('USER', 'MODERATOR', 'ADMIN', 'OWNER');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'role'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'bannedUntil'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "bannedUntil" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'banReason'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "banReason" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'silencedUntil'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "silencedUntil" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'silenceReason'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "silenceReason" TEXT;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ModeratorRequestStatus') THEN
    CREATE TYPE "ModeratorRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END$$;

CREATE TABLE "ModeratorRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "ModeratorRequestStatus" NOT NULL DEFAULT 'PENDING',
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModeratorRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ModeratorRequest_userId_key" UNIQUE ("userId")
);

-- Create user warnings table
CREATE TABLE "UserWarning" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "issuedById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserWarning_pkey" PRIMARY KEY ("id")
);

-- Add indexes for performance
CREATE INDEX "UserWarning_userId_idx" ON "UserWarning" ("userId");
CREATE INDEX "UserWarning_issuedById_idx" ON "UserWarning" ("issuedById");

-- Foreign keys to maintain relations
ALTER TABLE "ModeratorRequest"
  ADD CONSTRAINT "ModeratorRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserWarning"
  ADD CONSTRAINT "UserWarning_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "UserWarning_issuedById_fkey"
    FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
