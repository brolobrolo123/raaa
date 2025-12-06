import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./src/lib/prisma";
import { loginSchema } from "./src/lib/validators";

async function authorize(credential: string, password: string) {
  const parsed = loginSchema.safeParse({ credential, password });
  if (!parsed.success) {
    console.log(parsed.error.flatten());
    return null;
  }
  const normalized = credential.toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: normalized }, { username: normalized }] },
  });
  if (!user) {
    return null;
  }
  const valid = await bcrypt.compare(password, user.hashedPassword);
  return valid ? user : null;
}

async function main() {
  const credential = process.argv[2];
  const password = process.argv[3];
  if (!credential || !password) {
    throw new Error("Usage: tsx tmp-test-login.ts <credential> <password>");
  }
  const user = await authorize(credential, password);
  console.log(user ? `Authenticated as ${user.username}` : "Invalid credentials");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
