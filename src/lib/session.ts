import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";

export async function getSession() {
  return auth();
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, image: true, username: true },
  });
  if (!dbUser) {
    console.warn("Session user missing in database. Redirecting to login.");
    redirect("/login");
  }
  if (session.user) {
    session.user.image = dbUser.image ?? session.user.image;
    session.user.username = dbUser.username ?? session.user.username;
  }
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastSeenAt: new Date() },
    });
  } catch (error) {
    console.error("Failed to update lastSeenAt", error);
  }
  return session;
}
