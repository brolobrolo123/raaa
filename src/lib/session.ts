import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";

export async function getSession() {
  return auth();
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      image: true,
      username: true,
      fabPixelSprite: true,
      role: true,
      lastSeenAt: true,
      bannedUntil: true,
      permanentBan: true,
      banReason: true,
    },
  });
  if (!dbUser) {
    console.warn("Session user missing in database. Redirecting to login.");
    redirect("/");
  }
  if (session.user) {
    session.user.image = dbUser.image ?? session.user.image;
    session.user.username = dbUser.username ?? session.user.username;
    session.user.fabPixelSprite = dbUser.fabPixelSprite ?? session.user.fabPixelSprite ?? null;
    session.user.role = dbUser.role;
  }
  const now = new Date();
  if (dbUser.permanentBan || (dbUser.bannedUntil && dbUser.bannedUntil > now)) {
    const params = new URLSearchParams();
    params.set("banned", "1");
    if (dbUser.permanentBan) {
      params.set("permanent", "1");
    }
    if (dbUser.bannedUntil) {
      params.set("until", dbUser.bannedUntil.toISOString());
    }
    if (dbUser.banReason) {
      params.set("reason", dbUser.banReason);
    }
    redirect(`/?${params.toString()}`);
  }

  try {
    const previousLastSeen = dbUser.lastSeenAt ?? now;
    const minutesAgo = Math.max(0, Math.round((now.getTime() - previousLastSeen.getTime()) / 60000));
    const trackedMinutes = Math.min(minutesAgo, 60);
    if (trackedMinutes > 0) {
      await prisma.userActivity.create({
        data: {
          userId: session.user.id,
          durationMinutes: trackedMinutes,
        },
      });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastSeenAt: now },
    });
  } catch (error) {
    console.error("Failed to update lastSeenAt", error);
  }
  return session;
}
