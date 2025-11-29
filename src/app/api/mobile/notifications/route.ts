import { NextResponse } from "next/server";
import { getNotificationsPayload } from "@/lib/notifications";
import { extractUserIdFromRequest } from "@/lib/mobile-token";

export async function GET(request: Request) {
  const userId = await extractUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const payload = await getNotificationsPayload(userId);
  return NextResponse.json(payload);
}
