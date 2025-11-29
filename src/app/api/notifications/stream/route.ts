import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getNotificationsPayload } from "@/lib/notifications";
import { registerNotificationStream } from "@/lib/notification-stream";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireUser();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const send = async () => {
    const payload = await getNotificationsPayload(session.user.id);
    await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
  };

  await send();

  const heartbeat = setInterval(() => {
    void send();
  }, 15000);

  const close = () => {
    clearInterval(heartbeat);
    writer.close().catch(() => undefined);
  };

  const unregister = registerNotificationStream(session.user.id, async () => {
    try {
      await send();
    } catch {
      close();
      unregister();
    }
  });

  request.signal.addEventListener("abort", () => {
    unregister();
    close();
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
