import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getNotificationsPayload } from "@/lib/notifications";

export async function GET() {
  const session = await requireUser();
  const payload = await getNotificationsPayload(session.user.id);
  return NextResponse.json(payload);
}
