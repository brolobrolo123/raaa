/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  await prisma.$queryRaw`SELECT 1`;
  await prisma.$disconnect();
  console.log('works');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
