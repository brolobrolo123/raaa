-- CreateEnum
CREATE TYPE "PixelRegion" AS ENUM ('HEAD', 'BODY');

-- CreateTable
CREATE TABLE "PixelColorClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "region" "PixelRegion" NOT NULL,
    "pixelIndex" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PixelColorClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PixelColorClaim_region_pixelIndex_color_key" ON "PixelColorClaim"("region", "pixelIndex", "color");

-- CreateIndex
CREATE INDEX "PixelColorClaim_userId_idx" ON "PixelColorClaim"("userId");

-- AddForeignKey
ALTER TABLE "PixelColorClaim" ADD CONSTRAINT "PixelColorClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
