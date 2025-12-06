-- CreateTable
CREATE TABLE "ClubPoll" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ClubPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubPollVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubPollVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClubPoll_clubId_expiresAt_idx" ON "ClubPoll"("clubId", "expiresAt");

-- CreateIndex
CREATE INDEX "ClubPollVote_pollId_idx" ON "ClubPollVote"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubPollVote_pollId_userId_key" ON "ClubPollVote"("pollId", "userId");

-- AddForeignKey
ALTER TABLE "ClubPoll" ADD CONSTRAINT "ClubPoll_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPoll" ADD CONSTRAINT "ClubPoll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPollVote" ADD CONSTRAINT "ClubPollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "ClubPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPollVote" ADD CONSTRAINT "ClubPollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
