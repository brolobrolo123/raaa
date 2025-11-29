import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { markNotificationsAsRead } from "@/lib/notifications";

export async function POST() {
  const session = await requireUser();
  await markNotificationsAsRead(session.user.id);
  return NextResponse.json({ ok: true });
}
