-- AlterTable
ALTER TABLE "Avatar" ADD COLUMN "activeBattleId" TEXT;

-- CreateIndex
CREATE INDEX "Avatar_activeBattleId_idx" ON "Avatar"("activeBattleId");

-- AddForeignKey
ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_activeBattleId_fkey" FOREIGN KEY ("activeBattleId") REFERENCES "AvatarBattle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
