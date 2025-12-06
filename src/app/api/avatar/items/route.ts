import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getAvatarItems } from "@/lib/avatar/engine";

export async function GET() {
  const session = await requireUser();
  const items = await getAvatarItems(session.user.id);
  return NextResponse.json({ items });
}
