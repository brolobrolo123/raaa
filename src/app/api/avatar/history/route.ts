import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getAvatarHistory } from "@/lib/avatar/engine";

export async function GET() {
  const session = await requireUser();
  const history = await getAvatarHistory(session.user.id);
  return NextResponse.json({ history });
}
