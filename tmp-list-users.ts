import "dotenv/config";
import { prisma } from "./src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, username: true, email: true, hashedPassword: true },
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
