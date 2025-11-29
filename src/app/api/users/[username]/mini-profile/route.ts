import { NextResponse } from "next/server";
import { getMiniProfilePayload } from "@/lib/badge-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> },
) {
  const { username: rawUsername } = await context.params;
  const requested = rawUsername;
  if (!requested) {
    return NextResponse.json({ error: "Usuario no especificado." }, { status: 400 });
  }

  const username = decodeURIComponent(requested);
  try {
    const payload = await getMiniProfilePayload(username);
    if (!payload) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }
    return NextResponse.json(payload);
  } catch (error) {
    console.error("mini-profile lookup failed", error);
    return NextResponse.json({ error: "No se pudo cargar el miniperfil." }, { status: 500 });
  }
}
