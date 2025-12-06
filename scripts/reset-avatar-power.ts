import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const result = await prisma.avatar.updateMany({ data: { points: 0 } });
  console.log(`Reiniciados ${result.count} avatares.`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("No se pudo reiniciar el poder de los avatares:", error);
  await prisma.$disconnect();
  process.exit(1);
});
