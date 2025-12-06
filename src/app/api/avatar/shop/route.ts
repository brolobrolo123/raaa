import { NextResponse } from "next/server";
import { getAvailableShopItems } from "@/lib/avatar/engine";

export async function GET() {
  const items = getAvailableShopItems();
  return NextResponse.json({ items });
}
