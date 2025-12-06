import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [, , username, roleArg] = process.argv;
  if (!username) {
    console.error("Usage: node scripts/set-role.mjs <username> [role]");
    process.exit(1);
  }
  const role = (roleArg ?? "OWNER").toUpperCase();
  const validRoles = ["USER", "MODERATOR", "ADMIN", "OWNER"];
  if (!validRoles.includes(role)) {
    console.error(`Role must be one of: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { username },
    data: { role },
  });

  console.log(`Assigned role ${role} to ${user.username}`);
}

await main()
  .catch((error) => {
    console.error("Failed to set role", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
