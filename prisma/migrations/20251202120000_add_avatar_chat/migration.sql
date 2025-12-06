-- CreateTable
CREATE TABLE "AvatarBattleChatMessage" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvatarBattleChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalChatMessage" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GlobalChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvatarBattleChatMessage_battleId_createdAt_idx" ON "AvatarBattleChatMessage"("battleId", "createdAt");

-- CreateIndex
CREATE INDEX "GlobalChatMessage_createdAt_idx" ON "GlobalChatMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "AvatarBattleChatMessage" ADD CONSTRAINT "AvatarBattleChatMessage_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "AvatarBattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarBattleChatMessage" ADD CONSTRAINT "AvatarBattleChatMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalChatMessage" ADD CONSTRAINT "GlobalChatMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
