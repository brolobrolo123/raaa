-- Add forumPointsSpent to track redeemed forum contribution points for avatar upgrades
ALTER TABLE "Avatar" ADD COLUMN "forumPointsSpent" INTEGER NOT NULL DEFAULT 0;
