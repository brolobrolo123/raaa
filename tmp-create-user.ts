import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./src/lib/prisma";

async function main() {
  const username = process.argv[2];
  const email = process.argv[3];
  const password = process.argv[4];

  if (!username || !email || !password) {
    throw new Error("Usage: tsx tmp-create-user.ts <username> <email> <password>");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { username },
    update: { email, hashedPassword },
    create: { username, email, hashedPassword },
  });
  console.log(`User ${user.username} ready`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
