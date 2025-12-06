-- CreateEnum
CREATE TYPE "AvatarStatus" AS ENUM ('SEARCHING', 'IN_BATTLE', 'COOLDOWN');

-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('PENDING', 'COMPLETE');

-- CreateEnum
CREATE TYPE "AvatarItemType" AS ENUM ('BACKPACK');

-- DropIndex
DROP INDEX "UserWarning_issuedById_idx";

-- DropIndex
DROP INDEX "UserWarning_userId_idx";

-- AlterTable
ALTER TABLE "ModeratorRequest" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Avatar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentHp" INTEGER NOT NULL DEFAULT 100,
    "maxHp" INTEGER NOT NULL DEFAULT 100,
    "damage" INTEGER NOT NULL DEFAULT 1,
    "evasion" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "status" "AvatarStatus" NOT NULL DEFAULT 'SEARCHING',
    "inBattle" BOOLEAN NOT NULL DEFAULT false,
    "lastBattleAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarBattle" (
    "id" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "status" "BattleStatus" NOT NULL DEFAULT 'PENDING',
    "winnerId" TEXT,
    "loserId" TEXT,
    "firstStrikerId" TEXT,
    "rounds" INTEGER NOT NULL DEFAULT 0,
    "log" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AvatarBattle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarItem" (
    "id" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "AvatarItemType" NOT NULL DEFAULT 'BACKPACK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvatarItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Avatar_userId_key" ON "Avatar"("userId");

-- AddForeignKey
ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarBattle" ADD CONSTRAINT "AvatarBattle_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "Avatar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarBattle" ADD CONSTRAINT "AvatarBattle_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "Avatar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarItem" ADD CONSTRAINT "AvatarItem_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Avatar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
